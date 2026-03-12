// src/core/use-cases/game-engine/actions/internal/action-preconditions.ts - Validaciones reutilizables de precondición para acciones del jugador activo.
import { assertMainPhaseActionAllowedForActivePlayer } from "@/core/use-cases/game-engine/state/action-flow-preconditions";
import { GameState } from "@/core/use-cases/game-engine/state/types";

/**
 * Valida que una acción de despliegue/juego pueda ejecutarse en el turno y fase actuales.
 */
export function assertMainPhaseActionAllowed(state: GameState, playerId: string): void {
  assertMainPhaseActionAllowedForActivePlayer(state, playerId, {
    pendingActionMessage: "Debes resolver la acción obligatoria de inicio de turno antes de jugar cartas.",
    phaseMessage: "Solo puedes jugar cartas en la fase de despliegue.",
  });
}
