// src/core/services/progression/reset-schedule.ts - Calcula cuándo se regeneran las misiones (diaria: medianoche UTC; semanal: lunes UTC), igual que el period_key del backend.

/** Milisegundos hasta la próxima medianoche UTC (reset de misiones diarias). */
export function msUntilDailyReset(nowMs: number): number {
  const now = new Date(nowMs);
  const next = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0, 0);
  return next - nowMs;
}

/** Milisegundos hasta el próximo lunes 00:00 UTC (reset de misiones semanales, semana ISO). */
export function msUntilWeeklyReset(nowMs: number): number {
  const now = new Date(nowMs);
  const isoDay = now.getUTCDay() === 0 ? 7 : now.getUTCDay(); // lunes=1 … domingo=7
  const daysToMonday = 8 - isoDay; // lunes→7, domingo→1
  const next = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + daysToMonday, 0, 0, 0, 0);
  return next - nowMs;
}

/**
 * Milisegundos hasta el próximo cierre de los rankings semanales: domingos a las 22:00 UTC
 * (~medianoche en España), mismo corte que la clave de semana del backend (weekly_leaderboard_week_key).
 */
export function msUntilWeeklyLeaderboardReset(nowMs: number): number {
  const now = new Date(nowMs);
  const dayOffset = (7 - now.getUTCDay()) % 7; // días hasta el próximo domingo (0 si hoy ya es domingo)
  const candidate = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + dayOffset, 22, 0, 0, 0),
  );
  if (candidate.getTime() <= nowMs) candidate.setUTCDate(candidate.getUTCDate() + 7);
  return candidate.getTime() - nowMs;
}

/** Formatea una duración en una cuenta atrás compacta: "2d 3h", "5h 12m" o "8m". */
export function formatResetCountdown(ms: number): string {
  if (ms <= 0) return "ahora";
  const totalMinutes = Math.floor(ms / 60_000);
  const days = Math.floor(totalMinutes / 1_440);
  const hours = Math.floor((totalMinutes % 1_440) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}
