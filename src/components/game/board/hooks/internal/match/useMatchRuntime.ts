// src/components/game/board/hooks/internal/match/useMatchRuntime.ts - Encapsula reglas de runtime del duelo y transiciones del motor.
import { MutableRefObject, useCallback, useEffect, useMemo, useRef } from "react";
import { GameState } from "@/core/use-cases/GameEngine";
import { ICard } from "@/core/entities/ICard";
import { HeuristicOpponentStrategy } from "@/core/services/opponent/HeuristicOpponentStrategy";
import { resolveDifficultyFromCampaign } from "@/core/services/opponent/difficulty/resolveDifficultyFromCampaign";
import { ICampaignProgress } from "@/core/services/opponent/difficulty/types";
import { IOpponentStrategy } from "@/core/services/opponent/types";
import { toBoardUiError } from "../boardError";
import { useOpponentTurn } from "../useOpponentTurn";
import { usePlayerActions } from "../usePlayerActions";
import { useBoardTurnControls } from "../board-state/useBoardTurnControls";
import { IUseMatchUiStateResult } from "./useMatchUiState";
import { useEntityReplacementActions } from "./useEntityReplacementActions";

interface IUseMatchRuntimeParams {
  campaignProgress: ICampaignProgress;
  gameStateRef: MutableRefObject<GameState>;
  uiState: IUseMatchUiStateResult;
  winnerPlayerId: string | "DRAW" | null;
  isMatchStartLocked?: boolean;
  disableOpponentAutomation?: boolean;
  opponentStrategyOverride?: IOpponentStrategy | null;
}

export function useMatchRuntime({
  campaignProgress,
  gameStateRef,
  uiState,
  winnerPlayerId,
  isMatchStartLocked = false,
  disableOpponentAutomation = false,
  opponentStrategyOverride = null,
}: IUseMatchRuntimeParams) {
  const trapDecisionResolverRef = useRef<((activate: boolean) => void) | null>(null);
  const opponentDifficulty = useMemo(() => resolveDifficultyFromCampaign(campaignProgress), [campaignProgress]);
  const opponentStrategy = useMemo(
    () => opponentStrategyOverride ?? new HeuristicOpponentStrategy({ difficulty: opponentDifficulty }),
    [opponentDifficulty, opponentStrategyOverride],
  );

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

  const requestTrapActivationDecision = useCallback(
    (trapCard: ICard, trigger: "ON_OPPONENT_ATTACK_DECLARED" | "ON_OPPONENT_EXECUTION_ACTIVATED" | "ON_OPPONENT_TRAP_ACTIVATED"): Promise<boolean> =>
      new Promise<boolean>((resolve) => {
        trapDecisionResolverRef.current = resolve;
        uiState.setSelectedCard(trapCard);
        uiState.setPendingTrapActivationPrompt({ trapCard, trigger });
      }),
    [uiState],
  );

  const resolveTrapActivationDecision = useCallback(
    (activate: boolean) => {
      uiState.setPendingTrapActivationPrompt(null);
      uiState.clearSelection();
      const resolver = trapDecisionResolverRef.current;
      trapDecisionResolverRef.current = null;
      resolver?.(activate);
    },
    [uiState],
  );

  useEffect(() => {
    const prompt = uiState.pendingTrapActivationPrompt;
    if (!prompt) return;
    if (uiState.selectedCard?.id === prompt.trapCard.id) return;
    resolveTrapActivationDecision(false);
  }, [resolveTrapActivationDecision, uiState.pendingTrapActivationPrompt, uiState.selectedCard]);

  useOpponentTurn({
    gameState: uiState.gameState,
    isAnimating: uiState.isActionLocked,
    isMatchStartLocked,
    strategy: opponentStrategy,
    duelWinnerId: winnerPlayerId,
    applyTransition,
    disableAutomation: disableOpponentAutomation,
    clearSelection: uiState.clearSelection,
    clearError: uiState.clearError,
    setIsAnimating: uiState.setIsAnimating,
    setActiveAttackerId: uiState.setActiveAttackerId,
    setRevealedEntities: uiState.setRevealedEntities,
    setSelectedCard: uiState.setSelectedCard,
    requestTrapActivationDecision,
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

  const { confirmEntityReplacement, cancelEntityReplacement } = useEntityReplacementActions({ uiState, applyTransition });

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
    pendingTrapActivationPrompt: uiState.pendingTrapActivationPrompt,
    activatePendingTrap: () => resolveTrapActivationDecision(true),
    skipPendingTrap: () => resolveTrapActivationDecision(false),
  };
}
