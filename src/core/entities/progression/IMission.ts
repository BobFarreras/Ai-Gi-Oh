// src/core/entities/progression/IMission.ts - Contratos de misiones diarias/semanales y eventos de progresión.

export type MissionScope = "DAILY" | "WEEKLY" | "EVENT";

/** Acciones autoritativas que hacen progresar misiones. Se emiten desde los endpoints, no desde el cliente. */
export type ProgressionActionType =
  | "PLAY_DUEL"
  | "WIN_DUEL"
  | "PLAY_ARENA"
  | "WIN_ARENA"
  | "PLAY_MP_MATCH"
  | "WIN_MP_MATCH"
  | "BUY_CARD"
  | "BUY_PACK"
  | "BUY_ITEM"
  | "EVOLVE_CARD"
  | "SPEND_NEXUS"
  | "WIN_FLAWLESS_STORY"
  | "WIN_FLAWLESS_TRAINING"
  | "WIN_FLAWLESS_MP";

export type MissionRewardType = "NEXUS" | "EVENT_POINTS";

/** Vista de una misión con el progreso del jugador para el periodo actual. */
export interface IMissionView {
  missionId: string;
  scope: MissionScope;
  objectiveType: string;
  title: string;
  description: string | null;
  targetCount: number;
  rewardNexus: number;
  rewardType: MissionRewardType;
  /** Etiqueta de la moneda de recompensa ("Nexus" o el nombre de la moneda del evento). */
  rewardCurrency: string;
  eventId: string | null;
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
