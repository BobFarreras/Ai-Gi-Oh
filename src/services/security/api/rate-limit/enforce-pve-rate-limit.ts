// src/services/security/api/rate-limit/enforce-pve-rate-limit.ts - Aplica el mismo límite por jugador e IP en las rutas PvE autoritativas.
import { NextRequest, NextResponse } from "next/server";
import { resolveRequestClientIp } from "@/services/security/api/request-client-ip";
import { consumePveRateLimit } from "./pve-rate-limiter";

interface IPveRateLimit {
  /** Subdominio propietario de la ruta; separa los buckets de Supervivencia y Olimpo. */
  mode: "survival" | "olympus";
  /** Identifica la operación dentro de la clave del bucket. */
  operation: string;
  maxPerPlayer: number;
  maxPerIp: number;
  windowMs: number;
}

/**
 * Devuelve una respuesta 429 cuando se agota el cupo, o null si la petición puede continuar. El límite
 * por IP acota el abuso multicuenta desde un mismo origen; el de jugador acota el gasto individual.
 */
export async function enforcePveRateLimit(
  request: NextRequest,
  playerId: string,
  limit: IPveRateLimit,
  headers: Headers,
): Promise<NextResponse | null> {
  const clientIp = resolveRequestClientIp(request);
  const prefix = `${limit.mode}:${limit.operation}`;
  const [allowedForPlayer, allowedForIp] = await Promise.all([
    consumePveRateLimit(`${prefix}:user:${playerId}`, limit.maxPerPlayer, limit.windowMs),
    consumePveRateLimit(`${prefix}:ip:${clientIp}`, limit.maxPerIp, limit.windowMs),
  ]);
  if (allowedForPlayer && allowedForIp) return null;
  return NextResponse.json(
    { message: "Demasiadas peticiones de combate. Espera unos minutos e inténtalo de nuevo." },
    { status: 429, headers },
  );
}
