// src/core/entities/progression/IPlayerCardProgress.ts - Entidad de progresión por carta para versión, nivel y experiencia del jugador.
export interface IPlayerCardProgress {
  playerId: string;
  cardId: string;
  versionTier: number;
  level: number;
  xp: number;
  masteryPassiveSkillId: string | null;
  updatedAtIso: string;
}
