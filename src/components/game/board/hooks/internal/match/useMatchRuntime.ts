// src/components/game/board/hooks/internal/match/useMatchRuntime.ts - Encapsula reglas de runtime del duelo y transiciones del motor.
import { MutableRefObject, useMemo } from "react";
import { GameState } from "@/core/use-cases/GameEngine";
import { HeuristicOpponentStrategy } from "@/core/services/opponent/HeuristicOpponentStrategy";
import { resolveDifficultyFromCampaign } from "@/core/services/opponent/difficulty/resolveDifficultyFromCampaign";
import { ICampaignProgress } from "@/core/services/opponent/difficulty/types";
import { IOpponentStrategy } from "@/core/services/opponent/types";
import { useOpponentTurn } from "../useOpponentTurn";
import { usePlayerActions } from "../usePlayerActions";
import { useBoardTurnControls } from "../board-state/useBoardTurnControls";
import { IUseMatchUiStateResult } from "./useMatchUiState";
import { useEntityReplacementActions } from "./useEntityReplacementActions";
import { buildMatchRuntimeResult, buildOpponentTurnParams, buildPlayerActionsParams } from "./useMatchRuntime.builders";
import { useApplyTransition, useAssertPlayerTurn, useAutoClearBoardError, useAutoSyncGameStateRef, useTrapDecisionManager } from "./useMatchRuntime.internal";

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
  const opponentDifficulty = useMemo(() => resolveDifficultyFromCampaign(campaignProgress), [campaignProgress]);
  const opponentStrategy = useMemo(
    () => opponentStrategyOverride ?? new HeuristicOpponentStrategy({ difficulty: opponentDifficulty }),
    [opponentDifficulty, opponentStrategyOverride],
  );

  useAutoSyncGameStateRef(gameStateRef, uiState.gameState);
  useAutoClearBoardError(uiState);
  const applyTransition = useApplyTransition({ gameStateRef, uiState });
  const assertPlayerTurn = useAssertPlayerTurn({ gameStateRef, uiState, winnerPlayerId });
  const { requestTrapActivationDecision, resolveTrapActivationDecision } = useTrapDecisionManager({ uiState });

  useOpponentTurn(buildOpponentTurnParams({
    uiState,
    isMatchStartLocked,
    disableOpponentAutomation,
    opponentStrategy,
    winnerPlayerId,
    requestTrapActivationDecision,
    applyTransition,
  }));

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

  const { toggleCardSelection, executePlayAction, handleEntityClick } = usePlayerActions(
    buildPlayerActionsParams(uiState, assertPlayerTurn, applyTransition, turnControls.resolvePendingTurnAction),
  );

  const { confirmEntityReplacement, cancelEntityReplacement } = useEntityReplacementActions({ uiState, applyTransition });

  return buildMatchRuntimeResult({
    opponentDifficulty,
    applyTransition,
    toggleCardSelection,
    executePlayAction,
    handleEntityClick,
    turnControls,
    confirmEntityReplacement,
    cancelEntityReplacement,
    pendingTrapActivationPrompt: uiState.pendingTrapActivationPrompt,
    resolveTrapActivationDecision,
  });
}
