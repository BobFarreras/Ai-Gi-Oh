// src/core/use-cases/game-engine/actions/internal/action-preconditions.ts - Validaciones reutilizables de precondición para acciones del jugador activo.
import { GameRuleError } from "@/core/errors/GameRuleError";
import { GameState } from "@/core/use-cases/game-engine/state/types";

/**
 * Valida que una acción de despliegue/juego pueda ejecutarse en el turno y fase actuales.
 */
export function assertMainPhaseActionAllowed(state: GameState, playerId: string): void {
  if (state.pendingTurnAction) {
    throw new GameRuleError("Debes resolver la acción obligatoria de inicio de turno antes de jugar cartas.");
  }

  if (state.activePlayerId !== playerId) {
    throw new GameRuleError("No es tu turno.");
  }

  if (state.phase !== "MAIN_1") {
    throw new GameRuleError("Solo puedes jugar cartas en la fase de despliegue.");
  }
}
