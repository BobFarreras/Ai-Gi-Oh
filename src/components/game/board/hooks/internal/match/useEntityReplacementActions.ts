// src/components/game/board/hooks/internal/match/useEntityReplacementActions.ts - Encapsula confirmar/cancelar reemplazo de slot en tablero.
import { useCallback } from "react";
import { GameEngine, GameState } from "@/core/use-cases/GameEngine";
import { IUseMatchUiStateResult } from "@/components/game/board/hooks/internal/match/useMatchUiState";
import { useLocalActionEmitter } from "@/components/game/board/multiplayer/local-action-emitter";

interface IUseEntityReplacementActionsInput {
  uiState: IUseMatchUiStateResult;
  applyTransition: (transition: (state: GameState) => GameState) => GameState | null;
}

/**
 * Aísla la lógica de reemplazo para mantener `useMatchRuntime` por debajo del límite SRP/tamaño.
 */
export function useEntityReplacementActions({ uiState, applyTransition }: IUseEntityReplacementActionsInput) {
  const emitLocalAction = useLocalActionEmitter();
  const confirmEntityReplacement = useCallback(() => {
    if (!uiState.pendingEntityReplacement || !uiState.pendingEntityReplacementTargetId) return;
    const replacement = uiState.pendingEntityReplacement;
    const sacrificedId = uiState.pendingEntityReplacementTargetId;
    const replacedState = applyTransition((state) =>
      GameEngine.playCardWithZoneReplacement(
        state,
        state.playerA.id,
        replacement.cardId,
        replacement.mode,
        sacrificedId,
        replacement.zone,
      ),
    );
    if (!replacedState) return;
    // Sincronizar la jugada con reemplazo de zona al rival.
    emitLocalAction({
      type: "PLAY_CARD_REPLACE_ZONE",
      payload: { cardId: replacement.cardId, mode: replacement.mode, sacrificedEntityInstanceId: sacrificedId, zone: replacement.zone },
    });
    if (replacement.zone === "EXECUTIONS" && replacement.mode === "ACTIVATE") {
      const activatedExecution = [...replacedState.playerA.activeExecutions]
        .reverse()
        .find(
          (entity) =>
            entity.card.type === "EXECUTION" &&
            entity.mode === "ACTIVATE" &&
            (entity.card.runtimeId === replacement.cardId || entity.card.id === replacement.cardId),
        );
      if (activatedExecution) {
        const resolved = applyTransition((state) => GameEngine.resolveExecution(state, state.playerA.id, activatedExecution.instanceId));
        if (resolved) emitLocalAction({ type: "RESOLVE_EXECUTION", payload: { instanceId: activatedExecution.instanceId } });
      }
    }
    uiState.setPendingEntityReplacement(null);
    uiState.setPendingEntityReplacementTargetId(null);
    uiState.clearSelection();
  }, [applyTransition, uiState, emitLocalAction]);

  const cancelEntityReplacement = useCallback(() => {
    uiState.setPendingEntityReplacement(null);
    uiState.setPendingEntityReplacementTargetId(null);
    uiState.clearSelection();
  }, [uiState]);

  return { confirmEntityReplacement, cancelEntityReplacement };
}
