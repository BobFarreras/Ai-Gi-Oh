// src/app/api/story/duels/complete/route.ts - Registra resultado de duelo Story y aplica recompensas de primera victoria.
import { NextRequest, NextResponse } from "next/server";
import { ICard } from "@/core/entities/ICard";
import { ValidationError } from "@/core/errors/ValidationError";
import { GetOrCreatePlayerProgressUseCase } from "@/core/use-cases/player/GetOrCreatePlayerProgressUseCase";
import { SupabaseOpponentRepository } from "@/infrastructure/persistence/supabase/SupabaseOpponentRepository";
import { SupabasePlayerProgressRepository } from "@/infrastructure/persistence/supabase/SupabasePlayerProgressRepository";
import { SupabasePlayerStoryDuelProgressRepository } from "@/infrastructure/persistence/supabase/SupabasePlayerStoryDuelProgressRepository";
import { loadCardsByIds } from "@/infrastructure/persistence/supabase/internal/load-cards-by-ids";
import { resolveStoryRewardCards } from "@/services/story/resolve-story-reward-cards";
import { getAuthenticatedUserId } from "@/services/auth/api/internal/get-authenticated-user-id";
import { createPlayerRouteRepositories } from "@/services/player-persistence/create-player-route-repositories";

interface ICompleteStoryDuelPayload {
  chapter: number;
  duelIndex: number;
  didWin: boolean;
}

function buildRewardCardsPayload(cardsById: Map<string, ICard>, rewardCardIds: string[]): ICard[] {
  return rewardCardIds.flatMap((cardId) => {
    const card = cardsById.get(cardId);
    return card ? [{ ...card }] : [];
  });
}

export async function POST(request: NextRequest) {
  try {
    const response = NextResponse.json({ ok: true }, { status: 200 });
    const repositories = await createPlayerRouteRepositories(request, response);
    const playerId = await getAuthenticatedUserId(repositories.client);
    const payload = (await request.json()) as ICompleteStoryDuelPayload;
    if (!Number.isInteger(payload.chapter) || payload.chapter <= 0) throw new ValidationError("Capítulo inválido.");
    if (!Number.isInteger(payload.duelIndex) || payload.duelIndex <= 0) throw new ValidationError("Índice de duelo inválido.");
    if (typeof payload.didWin !== "boolean") throw new ValidationError("El resultado del duelo es obligatorio.");

    const opponentRepository = new SupabaseOpponentRepository(repositories.client);
    const storyProgressRepository = new SupabasePlayerStoryDuelProgressRepository(repositories.client);
    const playerProgressRepository = new SupabasePlayerProgressRepository(repositories.client);
    const duel = await opponentRepository.getStoryDuel(payload.chapter, payload.duelIndex);
    if (!duel) throw new ValidationError("No se encontró el duelo Story solicitado.");

    const previous = await storyProgressRepository.getByPlayerAndDuelId(playerId, duel.id);
    const duelProgress = await storyProgressRepository.registerDuelResult(playerId, duel.id, payload.didWin);
    const firstVictory = payload.didWin && previous?.bestResult !== "WON";
    if (!firstVictory) {
      return NextResponse.json(
        { duelProgress, rewarded: false, rewardNexus: 0, rewardPlayerExperience: 0, rewardCardIds: [], rewardCards: [] },
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
      },
      { status: 200, headers: response.headers },
    );
  } catch (error) {
    if (error instanceof ValidationError) return NextResponse.json({ message: error.message }, { status: 400 });
    return NextResponse.json({ message: "No se pudo registrar el resultado del duelo Story." }, { status: 400 });
  }
}
