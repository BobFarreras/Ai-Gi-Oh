// src/app/api/story/duels/complete/route.ts - Registra resultado de duelo Story y aplica recompensas de primera victoria.
import { NextRequest, NextResponse } from "next/server";
import { ICard } from "@/core/entities/ICard";
import { ValidationError } from "@/core/errors/ValidationError";
import { GetOrCreatePlayerProgressUseCase } from "@/core/use-cases/player/GetOrCreatePlayerProgressUseCase";
import { CommitStoryProgressUseCase } from "@/core/use-cases/story/CommitStoryProgressUseCase";
import { GetStoryWorldStateUseCase } from "@/core/use-cases/story/GetStoryWorldStateUseCase";
import { ResolveStoryNodeUseCase } from "@/core/use-cases/story/ResolveStoryNodeUseCase";
import { SupabaseOpponentRepository } from "@/infrastructure/persistence/supabase/SupabaseOpponentRepository";
import { SupabasePlayerProgressRepository } from "@/infrastructure/persistence/supabase/SupabasePlayerProgressRepository";
import { SupabasePlayerStoryDuelProgressRepository } from "@/infrastructure/persistence/supabase/SupabasePlayerStoryDuelProgressRepository";
import { SupabasePlayerStoryWorldRepository } from "@/infrastructure/persistence/supabase/SupabasePlayerStoryWorldRepository";
import { loadCardsByIds } from "@/infrastructure/persistence/supabase/internal/load-cards-by-ids";
import { resolveStoryDuelCompletionInput } from "@/services/story/duel-flow/resolve-story-duel-completion-input";
import { didWinFromStoryOutcome } from "@/services/story/duel-flow/story-duel-outcome";
import { resolveStoryRewardCards } from "@/services/story/resolve-story-reward-cards";
import { applyStoryMoveToCompactState } from "@/services/story/story-compact-state";
import { getAuthenticatedUserId } from "@/services/auth/api/internal/get-authenticated-user-id";
import { createPlayerRouteRepositories } from "@/services/player-persistence/create-player-route-repositories";

interface ICompleteStoryDuelPayload {
  chapter?: unknown;
  duelIndex?: unknown;
  didWin?: unknown;
  outcome?: unknown;
}

function buildRewardCardsPayload(cardsById: Map<string, ICard>, rewardCardIds: string[]): ICard[] {
  return rewardCardIds.flatMap((cardId) => {
    const card = cardsById.get(cardId);
    return card ? [{ ...card }] : [];
  });
}

async function commitStoryNodeResolution(input: {
  playerId: string;
  nodeId: string;
  opponentRepository: SupabaseOpponentRepository;
  storyProgressRepository: SupabasePlayerStoryDuelProgressRepository;
  storyWorldRepository: SupabasePlayerStoryWorldRepository;
}): Promise<string> {
  const worldStateUseCase = new GetStoryWorldStateUseCase(input.opponentRepository, input.storyProgressRepository);
  const worldState = await worldStateUseCase.execute({ playerId: input.playerId });
  const resolveNodeUseCase = new ResolveStoryNodeUseCase();
  const resolved = resolveNodeUseCase.execute({
    graph: worldState.graph,
    progress: worldState.progress,
    nodeId: input.nodeId,
    nowIso: new Date().toISOString(),
  });
  const commitUseCase = new CommitStoryProgressUseCase(input.storyWorldRepository);
  await commitUseCase.execute({ playerId: input.playerId, progress: resolved.progress });
  const compactState = await input.storyWorldRepository.getCompactStateByPlayerId(input.playerId);
  const nextState = applyStoryMoveToCompactState({
    state: compactState,
    fromNodeId: compactState.currentNodeId ?? "story-ch1-player-start",
    targetNodeId: input.nodeId,
  });
  await input.storyWorldRepository.saveCompactStateByPlayerId(input.playerId, nextState);
  return nextState.currentNodeId ?? input.nodeId;
}

async function moveBackOnStoryDefeat(input: {
  playerId: string;
  nodeId: string;
  opponentRepository: SupabaseOpponentRepository;
  storyProgressRepository: SupabasePlayerStoryDuelProgressRepository;
  storyWorldRepository: SupabasePlayerStoryWorldRepository;
}): Promise<string> {
  const worldStateUseCase = new GetStoryWorldStateUseCase(input.opponentRepository, input.storyProgressRepository);
  const worldState = await worldStateUseCase.execute({ playerId: input.playerId });
  const node = worldState.graph.nodes.find((entry) => entry.id === input.nodeId);
  const fallbackNodeId = node?.unlockRequirementNodeId ?? "story-ch1-player-start";
  const compactState = await input.storyWorldRepository.getCompactStateByPlayerId(input.playerId);
  const nextState = applyStoryMoveToCompactState({
    state: compactState,
    fromNodeId: compactState.currentNodeId ?? input.nodeId,
    targetNodeId: fallbackNodeId,
  });
  await input.storyWorldRepository.saveCompactStateByPlayerId(input.playerId, nextState);
  return nextState.currentNodeId ?? fallbackNodeId;
}

export async function POST(request: NextRequest) {
  try {
    const response = NextResponse.json({ ok: true }, { status: 200 });
    const repositories = await createPlayerRouteRepositories(request, response);
    const playerId = await getAuthenticatedUserId(repositories.client);
    const payload = (await request.json()) as ICompleteStoryDuelPayload;
    const input = resolveStoryDuelCompletionInput(payload);
    if (!input) throw new ValidationError("El resultado del duelo Story es inválido.");
    const didWin = didWinFromStoryOutcome(input.outcome);

    const opponentRepository = new SupabaseOpponentRepository(repositories.client);
    const storyProgressRepository = new SupabasePlayerStoryDuelProgressRepository(repositories.client);
    const storyWorldRepository = new SupabasePlayerStoryWorldRepository(repositories.client);
    const playerProgressRepository = new SupabasePlayerProgressRepository(repositories.client);
    const duel = await opponentRepository.getStoryDuel(input.chapter, input.duelIndex);
    if (!duel) throw new ValidationError("No se encontró el duelo Story solicitado.");

    const previous = await storyProgressRepository.getByPlayerAndDuelId(playerId, duel.id);
    const duelProgress = await storyProgressRepository.registerDuelResult(playerId, duel.id, didWin);
    const firstVictory = didWin && previous?.bestResult !== "WON";
    const returnNodeId = didWin
      ? await commitStoryNodeResolution({
          playerId,
          nodeId: duel.id,
          opponentRepository,
          storyProgressRepository,
          storyWorldRepository,
        }).catch(() => duel.id)
      : await moveBackOnStoryDefeat({
          playerId,
          nodeId: duel.id,
          opponentRepository,
          storyProgressRepository,
          storyWorldRepository,
        }).catch(() => "story-ch1-player-start");
    if (didWin) {
      // Si la migración de historial Story aún no está aplicada, no bloqueamos el cierre de duelo.
      // El commit de estado se ejecutó arriba para devolver returnNodeId al cliente.
    }
    if (!firstVictory) {
      return NextResponse.json(
        {
          duelProgress,
          rewarded: false,
          rewardNexus: 0,
          rewardPlayerExperience: 0,
          rewardCardIds: [],
          rewardCards: [],
          outcome: input.outcome,
          duelNodeId: duel.id,
          returnNodeId,
        },
        { status: 200, headers: response.headers },
      );
    }

    const rewardCardIds = resolveStoryRewardCards(duel.rewardCards);
    if (duel.rewardNexus > 0) await repositories.walletRepository.creditNexus(playerId, duel.rewardNexus);
    if (rewardCardIds.length > 0) await repositories.collectionRepository.addCards(playerId, rewardCardIds);
    const cardsById = rewardCardIds.length > 0 ? await loadCardsByIds(repositories.client, rewardCardIds) : new Map<string, ICard>();
    const rewardCards = buildRewardCardsPayload(cardsById, rewardCardIds);

    const progressUseCase = new GetOrCreatePlayerProgressUseCase(playerProgressRepository);
    const currentPlayerProgress = await progressUseCase.execute({ playerId });
    const nextPlayerExperience = currentPlayerProgress.playerExperience + duel.rewardPlayerExperience;
    const playerProgress = await playerProgressRepository.update({ playerId, playerExperience: nextPlayerExperience });
    return NextResponse.json(
      {
        duelProgress,
        rewarded: true,
        rewardNexus: duel.rewardNexus,
        rewardPlayerExperience: duel.rewardPlayerExperience,
        rewardCardIds,
        rewardCards,
        playerProgress,
        outcome: input.outcome,
        duelNodeId: duel.id,
        returnNodeId,
      },
      { status: 200, headers: response.headers },
    );
  } catch (error) {
    if (error instanceof ValidationError) return NextResponse.json({ message: error.message }, { status: 400 });
    return NextResponse.json({ message: "No se pudo registrar el resultado del duelo Story." }, { status: 400 });
  }
}
