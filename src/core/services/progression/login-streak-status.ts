// src/core/services/progression/login-streak-status.ts - Lógica pura para derivar el estado visible de la racha de login (qué día toca, si ya se reclamó hoy).

/** Fila mínima de racha persistida (fechas como ISO yyyy-mm-dd, UTC). */
export interface ILoginStreakRow {
  currentStreak: number;
  longestStreak: number;
  lastClaimDate: string | null;
}

/** Desplaza una fecha ISO (yyyy-mm-dd) en días, en UTC. */
function shiftIsoDate(iso: string, days: number): string {
  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/** Convierte una racha en un índice de día del ciclo de 7 (1..7). */
export function dayIndexForStreak(streak: number): number {
  return ((Math.max(streak, 1) - 1) % 7) + 1;
}

/**
 * Deriva si ya se reclamó hoy y qué día del calendario corresponde al próximo claim.
 * Refleja la misma lógica que la RPC `claim_daily_login` (día consecutivo continúa, hueco reinicia).
 */
export function resolveLoginStreakView(
  row: ILoginStreakRow,
  todayUtc: string,
): { claimedToday: boolean; pendingDayIndex: number } {
  const claimedToday = row.lastClaimDate === todayUtc;
  let projectedStreak: number;
  if (claimedToday) {
    projectedStreak = row.currentStreak;
  } else if (row.lastClaimDate === shiftIsoDate(todayUtc, -1)) {
    projectedStreak = row.currentStreak + 1;
  } else {
    projectedStreak = 1;
  }
  return { claimedToday, pendingDayIndex: dayIndexForStreak(projectedStreak) };
}
