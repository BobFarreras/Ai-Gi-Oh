// src/components/game/board/hooks/internal/board-state/useHandleTimerExpired.ts - Resuelve timeout de turno sin diálogos y con auto-selección en acciones obligatorias.
import { MutableRefObject, useCallback } from "react";
import { resolveWinnerPlayerId } from "@/core/services/turn/resolve-winner-player-id";
import { GameState } from "@/core/use-cases/GameEngine";

interface IUseHandleTimerExpiredParams {
  gameStateRef: MutableRefObject<GameState>;
  isAnimating: boolean;
  executeAdvancePhase: () => void;
  resolvePendingTurnAction: (selectedId: string) => void;
}

export function useHandleTimerExpired({ gameStateRef, isAnimating, executeAdvancePhase, resolvePendingTurnAction }: IUseHandleTimerExpiredParams) {
  return useCallback(() => {
    const currentState = gameStateRef.current;
    const hasWinnerNow = resolveWinnerPlayerId(currentState) !== null;
    if (hasWinnerNow || currentState.activePlayerId !== currentState.playerA.id || isAnimating) return;
    const pendingAction = currentState.pendingTurnAction;
    if (pendingAction?.playerId === currentState.playerA.id) {
      if (pendingAction.type === "DISCARD_FOR_HAND_LIMIT") {
        const leftmostCard = currentState.playerA.hand[0];
        if (leftmostCard) resolvePendingTurnAction(leftmostCard.runtimeId ?? leftmostCard.id);
        return;
      }
      if (pendingAction.type === "SELECT_FUSION_MATERIALS") {
        const available = currentState.playerA.activeEntities
          .map((entity) => entity.instanceId)
          .filter((instanceId) => !pendingAction.selectedMaterialInstanceIds.includes(instanceId));
        const autoPick = available.slice(0, 2 - pendingAction.selectedMaterialInstanceIds.length);
        autoPick.forEach((instanceId) => resolvePendingTurnAction(instanceId));
        return;
      }
      if (pendingAction.type === "SELECT_GRAVEYARD_CARD") {
        const candidate = [...currentState.playerA.graveyard].reverse().find((card) => !pendingAction.cardType || card.type === pendingAction.cardType);
        if (candidate) resolvePendingTurnAction(candidate.runtimeId ?? candidate.id);
        return;
      }
      return;
    }
    executeAdvancePhase();
  }, [executeAdvancePhase, gameStateRef, isAnimating, resolvePendingTurnAction]);
}
