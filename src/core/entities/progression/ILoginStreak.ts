// src/core/entities/progression/ILoginStreak.ts - Contratos del sistema de racha de login diario y recompensas.

export type LoginRewardType = "NEXUS" | "CARD";

/** Un día del calendario de recompensas de login (config). */
export interface ILoginRewardDay {
  dayIndex: number;
  rewardType: LoginRewardType;
  rewardNexus: number;
  rewardCardId: string | null;
  label: string | null;
}

/** Estado de la racha de login del jugador para renderizar el calendario. */
export interface ILoginStreakStatus {
  currentStreak: number;
  longestStreak: number;
  claimedToday: boolean;
  /** Día del calendario (1..7) que se otorgaría al reclamar hoy (o el ya reclamado hoy). */
  pendingDayIndex: number;
  calendar: ILoginRewardDay[];
}

/** Resultado de reclamar el login diario. */
export interface IDailyLoginClaimResult {
  applied: boolean;
  alreadyClaimed: boolean;
  currentStreak: number;
  dayIndex: number;
  rewardType: LoginRewardType;
  rewardNexus: number;
  rewardCardId: string | null;
}
