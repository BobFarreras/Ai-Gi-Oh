// src/core/use-cases/game-engine/state/summon-rules.ts - Regla pura de "¿puede invocar una entity normal
// este turno?": una invocación normal por turno + las EXTRA concedidas por Núcleo de Datos.
import { GameState } from "@/core/use-cases/game-engine/state/types";

/** ¿El jugador activo puede hacer una invocación normal (aún no ha invocado o le quedan extra)? */
export function canNormalSummon(state: Pick<GameState, "hasNormalSummonedThisTurn" | "extraSummonsThisTurn">): boolean {
  return !state.hasNormalSummonedThisTurn || (state.extraSummonsThisTurn ?? 0) > 0;
}
