// src/components/game/board/hooks/internal/match/useMatchRuntime.ts - Encapsula reglas de runtime del duelo y transiciones del motor.
import { MutableRefObject, useCallback, useEffect, useMemo } from "react";
import { GameEngine, GameState } from "@/core/use-cases/GameEngine";
import { HeuristicOpponentStrategy } from "@/core/services/opponent/HeuristicOpponentStrategy";
import { resolveDifficultyFromCampaign } from "@/core/services/opponent/difficulty/resolveDifficultyFromCampaign";
import { ICampaignProgress } from "@/core/services/opponent/difficulty/types";
import { toBoardUiError } from "../boardError";
import { useOpponentTurn } from "../useOpponentTurn";
import { usePlayerActions } from "../usePlayerActions";
import { useBoardTurnControls } from "../board-state/useBoardTurnControls";
import { IUseMatchUiStateResult } from "./useMatchUiState";

interface IUseMatchRuntimeParams {
  campaignProgress: ICampaignProgress;
  gameStateRef: MutableRefObject<GameState>;
  uiState: IUseMatchUiStateResult;
  winnerPlayerId: string | "DRAW" | null;
}

export function useMatchRuntime({ campaignProgress, gameStateRef, uiState, winnerPlayerId }: IUseMatchRuntimeParams) {
  const opponentDifficulty = useMemo(() => resolveDifficultyFromCampaign(campaignProgress), [campaignProgress]);
  const opponentStrategy = useMemo(() => new HeuristicOpponentStrategy({ difficulty: opponentDifficulty }), [opponentDifficulty]);

  useEffect(() => {
    gameStateRef.current = uiState.gameState;
  }, [gameStateRef, uiState.gameState]);

  useEffect(() => {
    if (!uiState.lastError) return;
    const timeoutId = setTimeout(() => uiState.setLastError(null), 3600);
    return () => clearTimeout(timeoutId);
  }, [uiState]);

  const applyTransition = useCallback(
    (transition: (state: GameState) => GameState): GameState | null => {
      try {
        const nextState = transition(gameStateRef.current);
        gameStateRef.current = nextState;
        uiState.setGameState(nextState);
        return nextState;
      } catch (error: unknown) {
        uiState.setLastError(toBoardUiError(error));
        return null;
      }
    },
    [gameStateRef, uiState],
  );

  const assertPlayerTurn = useCallback((): boolean => {
    if (winnerPlayerId) {
      uiState.setLastError({ code: "GAME_RULE_ERROR", message: "La partida ya terminó." });
      return false;
    }
    if (gameStateRef.current.activePlayerId === gameStateRef.current.playerA.id) return true;
    uiState.setLastError({ code: "GAME_RULE_ERROR", message: "No es tu turno. Espera a que el rival termine su fase." });
    return false;
  }, [gameStateRef, uiState, winnerPlayerId]);

  useOpponentTurn({
    gameState: uiState.gameState,
    isAnimating: uiState.isActionLocked,
    strategy: opponentStrategy,
    duelWinnerId: winnerPlayerId,
    applyTransition,
    clearSelection: uiState.clearSelection,
    clearError: uiState.clearError,
    setIsAnimating: uiState.setIsAnimating,
    setActiveAttackerId: uiState.setActiveAttackerId,
    setRevealedEntities: uiState.setRevealedEntities,
  });

  const turnControls = useBoardTurnControls({
    gameState: uiState.gameState,
    gameStateRef,
    selectedCard: uiState.selectedCard,
    winnerPlayerId,
    isAnimating: uiState.isActionLocked,
    isPlayerTurn: uiState.isPlayerTurn,
    isAutoPhaseEnabled: uiState.isAutoPhaseEnabled,
    isTurnHelpEnabled: uiState.isTurnHelpEnabled,
    assertPlayerTurn,
    applyTransition,
    clearSelection: uiState.clearSelection,
    clearError: uiState.clearError,
    disableTurnHelp: uiState.disableTurnHelp,
    setActiveAttackerId: uiState.setActiveAttackerId,
    setPlayingCard: uiState.setPlayingCard,
  });

  const { toggleCardSelection, executePlayAction, handleEntityClick } = usePlayerActions({
    gameState: uiState.gameState,
    isAnimating: uiState.isActionLocked,
    playingCard: uiState.playingCard,
    activeAttackerId: uiState.activeAttackerId,
    pendingEntityReplacement: uiState.pendingEntityReplacement,
    pendingEntityReplacementTargetId: uiState.pendingEntityReplacementTargetId,
    pendingFusionSummon: uiState.pendingFusionSummon,
    assertPlayerTurn,
    applyTransition,
    clearSelection: uiState.clearSelection,
    clearError: uiState.clearError,
    resolvePendingTurnAction: turnControls.resolvePendingTurnAction,
    setSelectedCard: uiState.setSelectedCard,
    setSelectedBoardEntityInstanceId: uiState.setSelectedBoardEntityInstanceId,
    setPlayingCard: uiState.setPlayingCard,
    setActiveAttackerId: uiState.setActiveAttackerId,
    setIsAnimating: uiState.setIsAnimating,
    setRevealedEntities: uiState.setRevealedEntities,
    setPendingEntityReplacement: uiState.setPendingEntityReplacement,
    setPendingEntityReplacementTargetId: uiState.setPendingEntityReplacementTargetId,
    setPendingFusionSummon: uiState.setPendingFusionSummon,
    setLastError: uiState.setLastError,
  });

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
      if (activatedExecution) {
        applyTransition((state) => GameEngine.resolveExecution(state, state.playerA.id, activatedExecution.instanceId));
      }
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

  return {
    opponentDifficulty,
    applyTransition,
    toggleCardSelection,
    executePlayAction,
    handleEntityClick,
    advancePhase: turnControls.advancePhase,
    confirmAdvancePhase: turnControls.confirmAdvancePhase,
    cancelAdvancePhase: turnControls.cancelAdvancePhase,
    pendingAdvanceWarning: turnControls.pendingAdvanceWarning,
    handleTimerExpired: turnControls.handleTimerExpired,
    resolvePendingTurnAction: turnControls.resolvePendingTurnAction,
    resolvePendingHandDiscard: turnControls.resolvePendingHandDiscard,
    setSelectedEntityToAttack: turnControls.setSelectedEntityToAttack,
    canSetSelectedEntityToAttack: turnControls.canSetSelectedEntityToAttack,
    confirmEntityReplacement,
    cancelEntityReplacement,
  };
}
