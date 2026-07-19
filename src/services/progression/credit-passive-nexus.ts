// src/services/progression/credit-passive-nexus.ts - Acredita el Nexus de la pasiva "Recaudación" al cerrar
// un duelo (ficha 3 v1.17). El motor del cliente solo CUENTA (GameState.nexusEarnedByPlayerId); aquí el
// servidor valida la forma del reporte y llama a la RPC `credit_passive_nexus` (service-role), que aplica
// idempotencia por operación y los topes 600/duelo y 1200/día. Solo la llaman los cierres de Story y Arena
// con duelo TERMINADO (el abandono no envía el reporte y además no se acredita).
import { createPrivilegedWriteClientResolver } from "@/infrastructure/persistence/supabase/internal/resolve-privileged-write-client";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface IPassiveNexusClaim {
  /** Nexus contado por el motor en el duelo (el servidor lo topa igualmente: 600/duelo, 1200/día). */
  earned: number;
  /** Clave de idempotencia del cierre (uuid generado UNA vez por duelo; los reintentos la reutilizan). */
  operationId: string;
}

/**
 * Valida el reporte del cliente. Devuelve null si no hay nada que acreditar o la forma es inválida
 * (reportes rotos no tumban el cierre del duelo: simplemente no cobran).
 */
export function parsePassiveNexusClaim(payload: Record<string, unknown>): IPassiveNexusClaim | null {
  const earnedRaw = payload.passiveNexusEarned;
  const operationId = payload.passiveNexusOperationId;
  if (typeof earnedRaw !== "number" || !Number.isFinite(earnedRaw)) return null;
  if (typeof operationId !== "string" || !UUID_PATTERN.test(operationId)) return null;
  const earned = Math.max(0, Math.trunc(earnedRaw));
  if (earned === 0) return null;
  return { earned, operationId };
}

/**
 * Acredita vía RPC (service-role) y devuelve lo REALMENTE acreditado (0 si operación repetida o tope).
 * NO lanza: un fallo aquí no debe impedir registrar el resultado del duelo.
 */
export async function creditPassiveNexus(playerId: string, claim: IPassiveNexusClaim | null): Promise<number> {
  if (!claim) return 0;
  try {
    const client = createPrivilegedWriteClientResolver()();
    const { data, error } = await client.rpc("credit_passive_nexus", {
      p_player_id: playerId,
      p_amount: claim.earned,
      p_operation_id: claim.operationId,
    });
    if (error) return 0;
    return typeof data === "number" && Number.isFinite(data) ? data : 0;
  } catch {
    return 0;
  }
}

export type CreditPassiveNexusFn = typeof creditPassiveNexus;
