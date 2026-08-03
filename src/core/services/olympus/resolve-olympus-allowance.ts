// src/core/services/olympus/resolve-olympus-allowance.ts - Deriva intentos restantes y reset UTC sin aceptar el periodo del cliente.
import { IOlympusAllowance, IOlympusSettings } from "@/core/entities/olympus/IOlympus";

/** Uso persistido de un periodo concreto; `null` cuando el jugador aún no ha gastado intentos hoy. */
export interface IOlympusDailyUsage {
  periodKey: string;
  attemptsUsed: number;
  dailyLimit: number;
}

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

/** Fecha UTC en formato `YYYY-MM-DD`, la misma clave que calcula Postgres al emitir. */
export function resolveOlympusPeriodKey(nowIso: string): string {
  const now = new Date(nowIso);
  if (Number.isNaN(now.getTime())) throw new RangeError("Fecha inválida para derivar el periodo de Olimpo.");
  return now.toISOString().slice(0, 10);
}

/**
 * El allowance vive por periodo: un registro de ayer no limita hoy, y el límite guardado manda sobre
 * la configuración vigente para que cambiar los settings a media jornada no retire intentos ya abiertos.
 */
export function resolveOlympusAllowance(
  settings: IOlympusSettings,
  usage: IOlympusDailyUsage | null,
  nowIso: string,
): IOlympusAllowance {
  const periodKey = resolveOlympusPeriodKey(nowIso);
  const current = usage && usage.periodKey === periodKey ? usage : null;
  const dailyLimit = current?.dailyLimit ?? settings.dailyAttemptLimit;
  const attemptsUsed = Math.max(0, current?.attemptsUsed ?? 0);
  const nextReset = new Date(`${periodKey}T00:00:00.000Z`).getTime() + MILLISECONDS_PER_DAY;
  return {
    periodKey,
    attemptsUsed,
    dailyLimit,
    attemptsRemaining: Math.max(0, dailyLimit - attemptsUsed),
    nextResetIso: new Date(nextReset).toISOString(),
  };
}
