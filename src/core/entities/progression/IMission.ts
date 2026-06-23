// src/core/entities/progression/IMission.ts - Contratos de misiones diarias/semanales y eventos de progresión.

export type MissionScope = "DAILY" | "WEEKLY";

/** Acciones autoritativas que hacen progresar misiones. Se emiten desde los endpoints, no desde el cliente. */
export type ProgressionActionType =
  | "PLAY_DUEL"
  | "WIN_DUEL"
  | "PLAY_MP_MATCH"
  | "WIN_MP_MATCH"
  | "BUY_CARD"
  | "BUY_PACK"
  | "EVOLVE_CARD";

/** Vista de una misión con el progreso del jugador para el periodo actual. */
export interface IMissionView {
  missionId: string;
  scope: MissionScope;
  objectiveType: string;
  title: string;
  description: string | null;
  targetCount: number;
  rewardNexus: number;
  periodKey: string;
  progress: number;
  completed: boolean;
  claimed: boolean;
}

/** Resultado de reclamar la recompensa de una misión. */
export interface IMissionClaimResult {
  applied: boolean;
  alreadyClaimed: boolean;
  rewardNexus: number;
}
