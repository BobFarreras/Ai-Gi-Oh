// src/components/game/board/hooks/useBoard.ts - Compone runtime, estado UI, progresión y audio del duelo en un contrato único para la capa visual.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GameState } from "@/core/use-cases/GameEngine";
import { ICard } from "@/core/entities/ICard";
import { IMatchMode } from "@/core/entities/match";
import { ICampaignProgress } from "@/core/services/opponent/difficulty/types";
import { IOpponentStrategy } from "@/core/services/opponent/types";
import { createMatchSeed } from "@/core/services/random/create-match-seed";
import { createInitialBoardState, ICreateInitialBoardStateInput } from "./internal/boardInitialState";
import { useMatchAudio } from "./internal/match/useMatchAudio";
import { useMatchProgression } from "./internal/match/useMatchProgression";
import { useMatchRuntime } from "./internal/match/useMatchRuntime";
import { useMatchUiState } from "./internal/match/useMatchUiState";
import { resolveWinnerPlayerId } from "./internal/match/board-derived-state";
import { useExecutionActivation } from "./internal/match/useExecutionActivation";

export function useBoard(
  initialPlayerDeck?: ICard[],
  mode: IMatchMode = "TRAINING",
  initialConfig?: ICreateInitialBoardStateInput,
  isMatchStartLocked = false,
  disableBaseSoundtrack = false,
  disableOpponentAutomation = false,
  opponentStrategyOverride: IOpponentStrategy | null = null,
) {
  const [campaignProgress] = useState<ICampaignProgress>({ chapterIndex: 1, duelIndex: 1, victories: 0 });
  const [matchSeed] = useState(() => createMatchSeed());
  const createInitialState = useCallback(
    () => createInitialBoardState({ ...initialConfig, mode, playerDeck: initialPlayerDeck, seed: initialConfig?.seed ?? matchSeed }),
    [initialConfig, initialPlayerDeck, matchSeed, mode],
  );
  const gameStateRef = useRef<GameState>(createInitialState());
  const uiState = useMatchUiState({ gameStateRef, createInitialState });
  const winnerPlayerId = useMemo(() => resolveWinnerPlayerId(uiState.gameState), [uiState.gameState]);
  useEffect(() => {
    if (mode !== "TUTORIAL" || !uiState.isAutoPhaseEnabled) return;
    uiState.setIsAutoPhaseEnabled(false);
  }, [mode, uiState]);
  const runtime = useMatchRuntime({
    campaignProgress,
    gameStateRef,
    uiState,
    winnerPlayerId,
    isMatchStartLocked,
    disableOpponentAutomation,
    opponentStrategyOverride,
  });
  const progression = useMatchProgression({
    mode,
    gameState: uiState.gameState,
    winnerPlayerId,
    applyTransition: runtime.applyTransition,
    setLastError: uiState.setLastError,
  });
  const audio = useMatchAudio({
    combatLog: uiState.gameState.combatLog,
    winnerPlayerId,
    playerId: uiState.gameState.playerA.id,
    isHistoryOpen: uiState.isHistoryOpen,
    hasSelectedCard: Boolean(uiState.selectedCard),
    lastErrorCode: uiState.lastError?.code ?? null,
    isMuted: uiState.isMuted,
    isPaused: uiState.isPaused,
    disableBaseSoundtrack,
  });
  const restartMatch = useCallback(() => {
    progression.resetBattleProgression();
    uiState.restartMatch();
  }, [progression, uiState]);
  const { canActivateSelectedExecution, activateSelectedExecution } = useExecutionActivation({
    gameState: uiState.gameState,
    isPlayerTurn: uiState.isPlayerTurn,
    isActionLocked: uiState.isActionLocked,
    selectedBoardEntityInstanceId: uiState.selectedBoardEntityInstanceId,
    winnerPlayerId,
    applyTransition: runtime.applyTransition,
    setIsAnimating: uiState.setIsAnimating,
    clearSelection: uiState.clearSelection,
  });

  return {
    gameState: uiState.gameState,
    selectedCard: uiState.selectedCard,
    selectedBoardEntityInstanceId: uiState.selectedBoardEntityInstanceId,
    playingCard: uiState.playingCard,
    isHistoryOpen: uiState.isHistoryOpen,
    activeAttackerId: uiState.activeAttackerId,
    revealedEntities: uiState.revealedEntities,
    lastError: uiState.lastError,
    pendingEntityReplacement: uiState.pendingEntityReplacement,
    pendingEntityReplacementTargetId: uiState.pendingEntityReplacementTargetId,
    opponentDifficulty: runtime.opponentDifficulty,
    isPlayerTurn: uiState.isPlayerTurn,
    isMuted: uiState.isMuted,
    isPaused: uiState.isPaused,
    isAutoPhaseEnabled: uiState.isAutoPhaseEnabled,
    isTurnHelpEnabled: uiState.isTurnHelpEnabled,
    isFusionCinematicActive: uiState.isFusionCinematicActive,
    setIsFusionCinematicActive: uiState.setIsFusionCinematicActive,
    winnerPlayerId,
    restartMatch,
    toggleMute: uiState.toggleMute,
    togglePause: uiState.togglePause,
    toggleAutoPhase: uiState.toggleAutoPhase,
    setIsHistoryOpen: uiState.setIsHistoryOpen,
    toggleCardSelection: runtime.toggleCardSelection,
    previewCard: uiState.previewCard,
    clearSelection: uiState.clearSelection,
    clearError: uiState.clearError,
    executePlayAction: runtime.executePlayAction,
    handleEntityClick: runtime.handleEntityClick,
    advancePhase: runtime.advancePhase,
    confirmAdvancePhase: runtime.confirmAdvancePhase,
    cancelAdvancePhase: runtime.cancelAdvancePhase,
    pendingAdvanceWarning: runtime.pendingAdvanceWarning,
    handleTimerExpired: runtime.handleTimerExpired,
    confirmEntityReplacement: runtime.confirmEntityReplacement,
    cancelEntityReplacement: runtime.cancelEntityReplacement,
    resolvePendingTurnAction: runtime.resolvePendingTurnAction,
    resolvePendingHandDiscard: runtime.resolvePendingHandDiscard,
    setSelectedEntityToAttack: runtime.setSelectedEntityToAttack,
    canSetSelectedEntityToAttack: runtime.canSetSelectedEntityToAttack,
    activateSelectedExecution,
    canActivateSelectedExecution,
    battleExperienceSummary: progression.battleExperienceSummary,
    battleExperienceCardLookup: progression.battleExperienceCardLookup,
    isBattleExperiencePending: progression.isBattleExperiencePending,
    matchSeed,
    playTimerExpired: audio.playTimerExpired,
    playTimerWarning: audio.playTimerWarning,
    playButtonClick: audio.playButtonClick,
    playBanner: audio.playBanner,
    ...uiState.pendingUi,
    ...uiState.combatFeedback,
  };
}
