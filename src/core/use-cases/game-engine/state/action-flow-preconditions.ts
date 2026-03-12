// src/core/use-cases/game-engine/state/action-flow-preconditions.ts - Guardas compartidas para validar turno activo y fase MAIN_1 en acciones del motor.
import { GameRuleError } from "@/core/errors/GameRuleError";
import { GameState } from "@/core/use-cases/game-engine/state/types";

interface IMainPhasePreconditionMessages {
  pendingActionMessage: string;
  phaseMessage: string;
}

/**
 * Valida precondiciones comunes de acciones jugables en MAIN_1 para el jugador activo.
 */
export function assertMainPhaseActionAllowedForActivePlayer(
  state: GameState,
  playerId: string,
  messages: IMainPhasePreconditionMessages,
): void {
  if (state.pendingTurnAction) {
    throw new GameRuleError(messages.pendingActionMessage);
  }

  if (state.activePlayerId !== playerId) {
    throw new GameRuleError("No es tu turno.");
  }

  if (state.phase !== "MAIN_1") {
    throw new GameRuleError(messages.phaseMessage);
  }
}
