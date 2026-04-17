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

function resolveBossRepeatRewardCardIds(duel: IStoryDuelDefinition): string[] {
  const guaranteedRewards = duel.rewardCards.filter((entry) => entry.isGuaranteed);
  if (guaranteedRewards.length > 0) {
    return guaranteedRewards.flatMap((entry) =>
      Array.from({ length: Math.max(1, entry.copies) }, () => entry.cardId),
    );
  }
  const fallbackReward = duel.rewardCards[0];
  if (!fallbackReward) return [];
  return [fallbackReward.cardId];
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
  const duelProgress = await params.storyProgressRepository.registerDuelResult(params.playerId, duel.id, didWin);
  const firstVictory = didWin
    && duelProgress.firstClearedAtIso !== null
    && duelProgress.lastPlayedAtIso !== null
    && duelProgress.firstClearedAtIso === duelProgress.lastPlayedAtIso;
  const shouldGrantStandardRewards = firstVictory;
  const shouldGrantBossRepeatCardReward = didWin && duel.isBossDuel && !firstVictory;
  const returnNodeId = await resolveStoryDuelReturnNode({
    playerId: params.playerId,
    duelNodeId: duel.id,
    didWin,
    opponentRepository: params.opponentRepository,
    storyProgressRepository: params.storyProgressRepository,
    storyWorldRepository: params.storyWorldRepository,
  });
  if (!shouldGrantStandardRewards && !shouldGrantBossRepeatCardReward) {
    return { duelProgress, rewarded: false, rewardNexus: 0, rewardPlayerExperience: 0, rewardCardIds: [], rewardCards: [], outcome: input.outcome, duelNodeId: duel.id, returnNodeId };
  }
  const rewardCardIds = shouldGrantBossRepeatCardReward
    ? resolveBossRepeatRewardCardIds(duel)
    : resolveStoryRewardCards(duel.rewardCards);
  const rewardNexus = shouldGrantStandardRewards ? duel.rewardNexus : 0;
  const rewardPlayerExperience = shouldGrantStandardRewards ? duel.rewardPlayerExperience : 0;
  if (rewardNexus > 0) await params.walletRepository.creditNexus(params.playerId, rewardNexus);
  if (rewardCardIds.length > 0) await params.collectionRepository.addCards(params.playerId, rewardCardIds);
  const cardsById = rewardCardIds.length > 0 ? await params.loadCardsByIds(rewardCardIds) : new Map<string, ICard>();
  const rewardCards = mapRewardCards(cardsById, rewardCardIds);
  const playerProgress = rewardPlayerExperience > 0
    ? await (async () => {
        const progressUseCase = new GetOrCreatePlayerProgressUseCase(params.playerProgressRepository);
        const currentPlayerProgress = await progressUseCase.execute({ playerId: params.playerId });
        return params.playerProgressRepository.update({
          playerId: params.playerId,
          playerExperience: currentPlayerProgress.playerExperience + rewardPlayerExperience,
        });
      })()
    : null;
  return {
    duelProgress,
    rewarded: true,
    rewardNexus,
    rewardPlayerExperience,
    rewardCardIds,
    rewardCards,
    ...(playerProgress ? { playerProgress } : {}),
    outcome: input.outcome,
    duelNodeId: duel.id,
    returnNodeId,
  };
}
