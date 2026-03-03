import { MutableRefObject, useCallback } from "react";
import { GameEngine, GameState } from "@/core/use-cases/GameEngine";

interface IUseBoardTurnControlsParams {
  gameState: GameState;
  gameStateRef: MutableRefObject<GameState>;
  winnerPlayerId: string | "DRAW" | null;
  isAnimating: boolean;
  isPlayerTurn: boolean;
  assertPlayerTurn: () => boolean;
  applyTransition: (transition: (state: GameState) => GameState) => GameState | null;
  clearSelection: () => void;
  clearError: () => void;
}

interface IUseBoardTurnControlsResult {
  advancePhase: () => void;
  resolvePendingTurnAction: (selectedId: string) => void;
  handleTimerExpired: () => void;
  resolvePendingHandDiscard: (cardId: string) => void;
}

export function useBoardTurnControls({
  gameState,
  gameStateRef,
  winnerPlayerId,
  isAnimating,
  isPlayerTurn,
  assertPlayerTurn,
  applyTransition,
  clearSelection,
  clearError,
}: IUseBoardTurnControlsParams): IUseBoardTurnControlsResult {
  const resolvePendingTurnAction = useCallback(
    (selectedId: string) => {
      if (isAnimating || !assertPlayerTurn()) return;
      const nextState = applyTransition((state) => GameEngine.resolvePendingTurnAction(state, state.playerA.id, selectedId));
      if (!nextState) return;
      clearSelection();
      clearError();
    },
    [applyTransition, assertPlayerTurn, clearError, clearSelection, isAnimating],
  );

  const advancePhase = useCallback(() => {
    if (winnerPlayerId || isAnimating || !assertPlayerTurn()) return;
    const nextState = applyTransition((state) => GameEngine.nextPhase(state));
    if (!nextState) return;
    clearSelection();
    clearError();
  }, [applyTransition, assertPlayerTurn, clearError, clearSelection, isAnimating, winnerPlayerId]);

  const handleTimerExpired = useCallback(() => {
    if (winnerPlayerId || !isPlayerTurn || isAnimating) return;
    const pendingAction = gameStateRef.current.pendingTurnAction;
    if (pendingAction?.playerId === gameStateRef.current.playerA.id) {
      if (pendingAction.type === "DISCARD_FOR_HAND_LIMIT") {
        const leftmostCard = gameStateRef.current.playerA.hand[0];
        if (leftmostCard) resolvePendingTurnAction(leftmostCard.id);
        return;
      }
      const oldestEntity = gameStateRef.current.playerA.activeEntities[0];
      if (oldestEntity) resolvePendingTurnAction(oldestEntity.instanceId);
      return;
    }
    advancePhase();
  }, [advancePhase, gameStateRef, isAnimating, isPlayerTurn, resolvePendingTurnAction, winnerPlayerId]);

  const resolvePendingHandDiscard = useCallback(
    (cardId: string) => {
      if (gameState.pendingTurnAction?.playerId !== gameState.playerA.id || gameState.pendingTurnAction.type !== "DISCARD_FOR_HAND_LIMIT") {
        return;
      }
      resolvePendingTurnAction(cardId);
    },
    [gameState.pendingTurnAction, gameState.playerA.id, resolvePendingTurnAction],
  );

  return {
    advancePhase,
    resolvePendingTurnAction,
    handleTimerExpired,
    resolvePendingHandDiscard,
  };
}
