// src/components/game/board/ui/internal/duel-result-reward-summary.ts - Tipo compartido del resumen de recompensas mostrado al finalizar duelos Story.
import { ICard } from "@/core/entities/ICard";

export interface IDuelResultRewardSummary {
  rewardNexus: number;
  rewardPlayerExperience: number;
  rewardCards: ICard[];
}
