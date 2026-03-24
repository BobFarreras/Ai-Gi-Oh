// src/core/entities/training/ITrainingProgress.ts - Entidades de progreso persistible para desbloqueos de tiers en entrenamiento.
export interface ITrainingTierStats {
  tier: number;
  wins: number;
  matches: number;
}

export interface ITrainingProgress {
  playerId: string;
  highestUnlockedTier: number;
  totalWins: number;
  totalMatches: number;
  tierStats: ITrainingTierStats[];
  updatedAtIso: string;
}
