// src/services/survival/api/security/enforce-survival-rate-limit.ts - Aplica el mismo límite por jugador e IP en las tres rutas de Supervivencia.
import { NextRequest, NextResponse } from "next/server";
import { resolveRequestClientIp } from "@/services/security/api/request-client-ip";
import { consumeSurvivalRateLimit } from "./survival-rate-limiter";

interface ISurvivalRateLimit {
  /** Identifica la operación dentro de la clave del bucket. */
  operation: "start" | "issue" | "complete";
  maxPerPlayer: number;
  maxPerIp: number;
  windowMs: number;
}

/**
 * Devuelve una respuesta 429 cuando se agota el cupo, o null si la petición puede continuar. El límite
 * por IP acota el abuso multicuenta desde un mismo origen; el de jugador acota el gasto individual.
 */
export async function enforceSurvivalRateLimit(
  request: NextRequest,
  playerId: string,
  limit: ISurvivalRateLimit,
  headers: Headers,
): Promise<NextResponse | null> {
  const clientIp = resolveRequestClientIp(request);
  const [allowedForPlayer, allowedForIp] = await Promise.all([
    consumeSurvivalRateLimit(`survival:${limit.operation}:user:${playerId}`, limit.maxPerPlayer, limit.windowMs),
    consumeSurvivalRateLimit(`survival:${limit.operation}:ip:${clientIp}`, limit.maxPerIp, limit.windowMs),
  ]);
  if (allowedForPlayer && allowedForIp) return null;
  return NextResponse.json(
    { message: "Demasiadas peticiones de Supervivencia. Espera unos minutos e inténtalo de nuevo." },
    { status: 429, headers },
  );
}
