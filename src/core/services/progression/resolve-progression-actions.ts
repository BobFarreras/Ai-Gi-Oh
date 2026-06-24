// src/core/services/progression/resolve-progression-actions.ts - Fuente única de verdad de qué acciones de progresión produce un duelo según modo y resultado.
import { ProgressionActionType } from "@/core/entities/progression/IMission";

export type DuelProgressionMode = "STORY" | "TRAINING" | "MULTIPLAYER";

/**
 * Acciones de progresión emitidas al cerrar un duelo. Centralizado para que las rutas
 * de story/training/multiplayer no diverjan y se pueda testear el mapeo completo.
 */
export function resolveDuelProgressionActions(mode: DuelProgressionMode, won: boolean): ProgressionActionType[] {
  const actions: ProgressionActionType[] = ["PLAY_DUEL"];
  if (mode === "TRAINING") actions.push("PLAY_ARENA");
  if (mode === "MULTIPLAYER") actions.push("PLAY_MP_MATCH");
  if (won) {
    actions.push("WIN_DUEL");
    if (mode === "TRAINING") actions.push("WIN_ARENA");
    if (mode === "MULTIPLAYER") actions.push("WIN_MP_MATCH");
  }
  return actions;
}
