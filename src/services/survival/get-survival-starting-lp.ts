// src/services/survival/get-survival-starting-lp.ts - Resuelve los LP persistentes de una run desde habilidades server-side.
import { getPlayerCombatModifiersByPlayerId } from "@/services/progression/get-player-combat-modifiers";

/** Normaliza el bonus para que la vida persistida nunca dependa de valores del cliente. */
export function resolveSurvivalStartingLp(baseLp: number, startingLpBonus: number): number {
  return Math.max(1, Math.floor(baseLp)) + Math.max(0, Math.floor(startingLpBonus));
}

/** Consulta el árbol del jugador y fija el máximo efectivo para toda la expedición. */
export async function getSurvivalStartingLp(playerId: string, baseLp: number): Promise<number> {
  const modifiers = await getPlayerCombatModifiersByPlayerId(playerId);
  return resolveSurvivalStartingLp(baseLp, modifiers.startingLpBonus);
}
