// src/components/game/board/hooks/internal/match/useEntityReplacementActions.ts - Encapsula confirmar/cancelar reemplazo de slot en tablero.
import { useCallback } from "react";
import { GameEngine, GameState } from "@/core/use-cases/GameEngine";
import { IUseMatchUiStateResult } from "@/components/game/board/hooks/internal/match/useMatchUiState";

interface IUseEntityReplacementActionsInput {
  uiState: IUseMatchUiStateResult;
  applyTransition: (transition: (state: GameState) => GameState) => GameState | null;
}

/**
 * Aísla la lógica de reemplazo para mantener `useMatchRuntime` por debajo del límite SRP/tamaño.
 */
export function useEntityReplacementActions({ uiState, applyTransition }: IUseEntityReplacementActionsInput) {
  const confirmEntityReplacement = useCallback(() => {
    if (!uiState.pendingEntityReplacement || !uiState.pendingEntityReplacementTargetId) return;
    const replacedState = applyTransition((state) =>
      GameEngine.playCardWithZoneReplacement(
        state,
        state.playerA.id,
        uiState.pendingEntityReplacement!.cardId,
        uiState.pendingEntityReplacement!.mode,
        uiState.pendingEntityReplacementTargetId!,
        uiState.pendingEntityReplacement!.zone,
      ),
    );
    if (!replacedState) return;
    if (uiState.pendingEntityReplacement.zone === "EXECUTIONS" && uiState.pendingEntityReplacement.mode === "ACTIVATE") {
      const activatedExecution = [...replacedState.playerA.activeExecutions]
        .reverse()
        .find(
          (entity) =>
            entity.card.type === "EXECUTION" &&
            entity.mode === "ACTIVATE" &&
            (entity.card.runtimeId === uiState.pendingEntityReplacement?.cardId || entity.card.id === uiState.pendingEntityReplacement?.cardId),
        );
      if (activatedExecution) applyTransition((state) => GameEngine.resolveExecution(state, state.playerA.id, activatedExecution.instanceId));
    }
    uiState.setPendingEntityReplacement(null);
    uiState.setPendingEntityReplacementTargetId(null);
    uiState.clearSelection();
  }, [applyTransition, uiState]);

  const cancelEntityReplacement = useCallback(() => {
    uiState.setPendingEntityReplacement(null);
    uiState.setPendingEntityReplacementTargetId(null);
    uiState.clearSelection();
  }, [uiState]);

  return { confirmEntityReplacement, cancelEntityReplacement };
}
