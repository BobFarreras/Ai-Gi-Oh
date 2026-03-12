// src/app/api/story/duels/complete/internal/process-story-duel-completion.ts - Orquesta cierre de duelo Story y cálculo de recompensas de primera victoria.
import { ICard } from "@/core/entities/ICard";
import { IStoryDuelDefinition } from "@/core/entities/opponent/IStoryDuelDefinition";
import { ValidationError } from "@/core/errors/ValidationError";
import { ICardCollectionRepository } from "@/core/repositories/ICardCollectionRepository";
import { IOpponentRepository } from "@/core/repositories/IOpponentRepository";
import { IPlayerProgressRepository } from "@/core/repositories/IPlayerProgressRepository";
import { IPlayerStoryDuelProgressRepository } from "@/core/repositories/IPlayerStoryDuelProgressRepository";
import { IPlayerStoryWorldRepository } from "@/core/repositories/IPlayerStoryWorldRepository";
import { IWalletRepository } from "@/core/repositories/IWalletRepository";
import { GetOrCreatePlayerProgressUseCase } from "@/core/use-cases/player/GetOrCreatePlayerProgressUseCase";
import { resolveStoryDuelCompletionInput } from "@/services/story/duel-flow/resolve-story-duel-completion-input";
import { didWinFromStoryOutcome } from "@/services/story/duel-flow/story-duel-outcome";
import { resolveStoryRewardCards } from "@/services/story/resolve-story-reward-cards";
import { resolveStoryDuelReturnNode } from "@/app/api/story/duels/complete/internal/resolve-story-duel-return-node";

interface IProcessStoryDuelCompletionParams {
  playerId: string;
  payload: Record<string, unknown>;
  opponentRepository: IOpponentRepository;
  storyProgressRepository: IPlayerStoryDuelProgressRepository;
  storyWorldRepository: IPlayerStoryWorldRepository;
  playerProgressRepository: IPlayerProgressRepository;
  walletRepository: IWalletRepository;
  collectionRepository: ICardCollectionRepository;
  loadCardsByIds: (cardIds: string[]) => Promise<Map<string, ICard>>;
}

function mapRewardCards(cardsById: Map<string, ICard>, rewardCardIds: string[]): ICard[] {
  return rewardCardIds.flatMap((cardId) => {
    const card = cardsById.get(cardId);
    return card ? [{ ...card }] : [];
  });
}

async function resolveDuelFromPayload(payload: Record<string, unknown>, opponentRepository: IOpponentRepository): Promise<IStoryDuelDefinition> {
  const input = resolveStoryDuelCompletionInput(payload);
  if (!input) throw new ValidationError("El resultado del duelo Story es inválido.");
  const duel = await opponentRepository.getStoryDuel(input.chapter, input.duelIndex);
  if (!duel) throw new ValidationError("No se encontró el duelo Story solicitado.");
  return duel;
}

/**
 * Ejecuta el flujo completo de cierre de duelo Story devolviendo payload listo para respuesta HTTP.
 */
export async function processStoryDuelCompletion(params: IProcessStoryDuelCompletionParams): Promise<Record<string, unknown>> {
  const input = resolveStoryDuelCompletionInput(params.payload);
  if (!input) throw new ValidationError("El resultado del duelo Story es inválido.");
  const didWin = didWinFromStoryOutcome(input.outcome);
  const duel = await resolveDuelFromPayload(params.payload, params.opponentRepository);
  const previous = await params.storyProgressRepository.getByPlayerAndDuelId(params.playerId, duel.id);
  const duelProgress = await params.storyProgressRepository.registerDuelResult(params.playerId, duel.id, didWin);
  const firstVictory = didWin && previous?.bestResult !== "WON";
  const returnNodeId = await resolveStoryDuelReturnNode({
    playerId: params.playerId,
    duelNodeId: duel.id,
    didWin,
    opponentRepository: params.opponentRepository,
    storyProgressRepository: params.storyProgressRepository,
    storyWorldRepository: params.storyWorldRepository,
  });
  if (!firstVictory) {
    return { duelProgress, rewarded: false, rewardNexus: 0, rewardPlayerExperience: 0, rewardCardIds: [], rewardCards: [], outcome: input.outcome, duelNodeId: duel.id, returnNodeId };
  }
  const rewardCardIds = resolveStoryRewardCards(duel.rewardCards);
  if (duel.rewardNexus > 0) await params.walletRepository.creditNexus(params.playerId, duel.rewardNexus);
  if (rewardCardIds.length > 0) await params.collectionRepository.addCards(params.playerId, rewardCardIds);
  const cardsById = rewardCardIds.length > 0 ? await params.loadCardsByIds(rewardCardIds) : new Map<string, ICard>();
  const rewardCards = mapRewardCards(cardsById, rewardCardIds);
  const progressUseCase = new GetOrCreatePlayerProgressUseCase(params.playerProgressRepository);
  const currentPlayerProgress = await progressUseCase.execute({ playerId: params.playerId });
  const playerProgress = await params.playerProgressRepository.update({
    playerId: params.playerId,
    playerExperience: currentPlayerProgress.playerExperience + duel.rewardPlayerExperience,
  });
  return {
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
  };
}
