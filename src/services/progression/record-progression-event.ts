// src/services/progression/record-progression-event.ts - Registra acciones autoritativas de progresión (misiones). Fire-and-forget: nunca rompe el flujo principal.
import type { SupabaseClient } from "@supabase/supabase-js";
import { ProgressionActionType } from "@/core/entities/progression/IMission";

/**
 * Incrementa las misiones activas que matcheen las acciones dadas. Se llama desde los
 * endpoints server-side (donde la acción ya está validada y persistida), nunca desde el cliente.
 * La identidad la deriva la RPC vía auth.uid(). Tragamos cualquier error: la progresión es accesoria.
 */
export async function recordProgressionEvent(
  client: SupabaseClient,
  actionTypes: ProgressionActionType[],
  count = 1,
): Promise<void> {
  if (actionTypes.length === 0) return;
  try {
    await client.rpc("record_progression_event", { p_action_types: actionTypes, p_count: count });
  } catch {
    // La progresión nunca debe romper la acción principal (compra, duelo, etc.).
  }
}
