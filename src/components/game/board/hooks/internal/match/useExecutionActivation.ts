// src/components/game/board/hooks/internal/match/useExecutionActivation.ts - Encapsula selección y activación de ejecuciones SET para mantener useBoard enfocado en composición.
import { useCallback, useMemo } from "react";
import { GameEngine, GameState } from "@/core/use-cases/GameEngine";
import { sleep } from "@/components/game/board/hooks/internal/sleep";

const EXECUTION_ACTIVATION_PREVIEW_MS = 720;

interface IUseExecutionActivationInput {
  gameState: GameState;
  isPlayerTurn: boolean;
  isActionLocked: boolean;
  selectedBoardEntityInstanceId: string | null;
  winnerPlayerId: string | "DRAW" | null;
  applyTransition: (transition: (state: GameState) => GameState) => GameState | null;
  setIsAnimating: (value: boolean) => void;
  clearSelection: () => void;
}

interface IUseExecutionActivationOutput {
  canActivateSelectedExecution: boolean;
  activateSelectedExecution: () => Promise<"NOOP" | "ACTIVATED" | "MISSING_MATERIALS">;
}

function isExecutionWaitingForFusionMaterials(state: GameState, executionInstanceId: string): boolean {
  return (
    state.pendingTurnAction?.playerId === state.playerA.id &&
    state.pendingTurnAction.type === "SELECT_FUSION_MATERIALS" &&
    state.pendingTurnAction.fusionFromExecutionInstanceId === executionInstanceId
  );
}

/**
 * Aísla la lógica de activación de ejecuciones para evitar mezclarla con composición de estado principal.
 */
export function useExecutionActivation(input: IUseExecutionActivationInput): IUseExecutionActivationOutput {
  const selectedActivatableExecution = useMemo(() => {
    if (!input.selectedBoardEntityInstanceId) return null;
    return (
      input.gameState.playerA.activeExecutions.find(
        (entity) =>
          entity.instanceId === input.selectedBoardEntityInstanceId &&
          entity.mode === "SET" &&
          entity.card.type === "EXECUTION",
      ) ?? null
    );
  }, [input.gameState.playerA.activeExecutions, input.selectedBoardEntityInstanceId]);

  const canActivateSelectedExecution =
    Boolean(selectedActivatableExecution) &&
    !input.winnerPlayerId &&
    input.isPlayerTurn &&
    input.gameState.phase === "MAIN_1" &&
    !input.isActionLocked &&
    input.gameState.pendingTurnAction?.playerId !== input.gameState.playerA.id;

  const activateSelectedExecution = useCallback(async (): Promise<"NOOP" | "ACTIVATED" | "MISSING_MATERIALS"> => {
    if (!canActivateSelectedExecution || !selectedActivatableExecution) return "NOOP";
    input.setIsAnimating(true);
    const activated = input.applyTransition((state) =>
      GameEngine.changeEntityMode(state, state.playerA.id, selectedActivatableExecution.instanceId, "ACTIVATE"),
    );
    if (!activated) {
      input.setIsAnimating(false);
      return "NOOP";
    }
    await sleep(EXECUTION_ACTIVATION_PREVIEW_MS);
    const resolved = input.applyTransition((state) =>
      GameEngine.resolveExecution(state, state.playerA.id, selectedActivatableExecution.instanceId),
    );
    input.setIsAnimating(false);
    if (!resolved) return "NOOP";
    if (isExecutionWaitingForFusionMaterials(resolved, selectedActivatableExecution.instanceId)) {
      input.clearSelection();
      return "MISSING_MATERIALS";
    }
    input.clearSelection();
    return "ACTIVATED";
  }, [canActivateSelectedExecution, input, selectedActivatableExecution]);

  return { canActivateSelectedExecution, activateSelectedExecution };
}
