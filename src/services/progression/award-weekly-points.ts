// src/services/progression/award-weekly-points.ts - Acredita puntos al ranking semanal (tableros ACTIVITY/
// COMMERCIAL) por una o varias acciones. Fire-and-forget: la progresión nunca rompe el flujo principal.
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Suma puntos de ranking semanal al jugador autenticado según las reglas por acción (RPC server-side,
 * identidad por auth.uid()). Se llama desde los endpoints donde la acción ya está validada y persistida.
 * Los tipos de acción son los mismos del bus de progresión (PLAY_*, BUY_*, …) más pseudo-acciones como
 * "MISSION_CLAIM"; los que no tengan regla configurada simplemente no otorgan puntos.
 */
export async function awardWeeklyPoints(
  client: SupabaseClient,
  actionTypes: string[],
  count = 1,
): Promise<void> {
  if (actionTypes.length === 0) return;
  try {
    await client.rpc("award_weekly_points", { p_action_types: actionTypes, p_count: count });
  } catch {
    // El ranking es accesorio: nunca debe romper la acción principal (compra, duelo, claim, etc.).
  }
}
