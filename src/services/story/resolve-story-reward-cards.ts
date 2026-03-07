// src/services/story/resolve-story-reward-cards.ts - Resuelve cartas recompensa de un duelo Story combinando drops garantizados y probabilísticos.
import { IStoryRewardCardDefinition } from "@/core/entities/opponent/IStoryDuelDefinition";

export function resolveStoryRewardCards(rewardCards: IStoryRewardCardDefinition[], randomSource: () => number = Math.random): string[] {
  return rewardCards.flatMap((entry) => {
    if (entry.isGuaranteed) return Array.from({ length: entry.copies }).map(() => entry.cardId);
    const accepted = randomSource() <= entry.dropRate;
    if (!accepted) return [];
    return Array.from({ length: entry.copies }).map(() => entry.cardId);
  });
}
