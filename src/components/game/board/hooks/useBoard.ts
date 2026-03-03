import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GameState } from "@/core/use-cases/GameEngine";
import { HeuristicOpponentStrategy } from "@/core/services/opponent/HeuristicOpponentStrategy";
import { resolveDifficultyFromCampaign } from "@/core/services/opponent/difficulty/resolveDifficultyFromCampaign";
import { ICampaignProgress } from "@/core/services/opponent/difficulty/types";
import { createInitialBoardState } from "./internal/boardInitialState";
import { toBoardUiError } from "./internal/boardError";
import { buildBoardCombatFeedback } from "./internal/boardCombatFeedback";
import { buildBoardPendingUi } from "./internal/boardPendingUi";
import { buildUseBoardResult } from "./internal/buildUseBoardResult";
import { useBoardTurnControls } from "./internal/useBoardTurnControls";
import { useBoardUiState } from "./internal/useBoardUiState";
import { useOpponentTurn } from "./internal/useOpponentTurn";
import { usePlayerActions } from "./internal/usePlayerActions";

function resolveWinnerPlayerId(gameState: GameState): string | "DRAW" | null {
  if (gameState.playerA.healthPoints <= 0 && gameState.playerB.healthPoints <= 0) return "DRAW";
  if (gameState.playerA.healthPoints <= 0) return gameState.playerB.id;
  if (gameState.playerB.healthPoints <= 0) return gameState.playerA.id;
  return null;
}

export function useBoard() {
  const [campaignProgress] = useState<ICampaignProgress>({ chapterIndex: 1, duelIndex: 1, victories: 0 });
  const gameStateRef = useRef<GameState>(createInitialBoardState());
  const uiState = useBoardUiState(gameStateRef, createInitialBoardState);
  const gameState = uiState.gameState;
  const opponentDifficulty = useMemo(() => resolveDifficultyFromCampaign(campaignProgress), [campaignProgress]);
  const opponentStrategy = useMemo(() => new HeuristicOpponentStrategy({ difficulty: opponentDifficulty }), [opponentDifficulty]);
  const isPlayerTurn = gameState.activePlayerId === gameState.playerA.id;
  const winnerPlayerId = useMemo(() => resolveWinnerPlayerId(gameState), [gameState]);
  const combatFeedback = useMemo(() => buildBoardCombatFeedback(gameState.combatLog), [gameState.combatLog]);
  const pendingUi = useMemo(
    () => buildBoardPendingUi(gameState, uiState.pendingFusionSummon, uiState.pendingEntityReplacement),
    [gameState, uiState.pendingEntityReplacement, uiState.pendingFusionSummon],
  );

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    if (!uiState.lastError) return;
    const timeoutId = setTimeout(() => uiState.setLastError(null), 3600);
    return () => clearTimeout(timeoutId);
  }, [uiState]);

  const applyTransition = useCallback((transition: (state: GameState) => GameState): GameState | null => {
    try {
      const nextState = transition(gameStateRef.current);
      gameStateRef.current = nextState;
      uiState.setGameState(nextState);
      return nextState;
    } catch (error: unknown) {
      uiState.setLastError(toBoardUiError(error));
      return null;
    }
  }, [uiState]);
  const assertPlayerTurn = useCallback((): boolean => {
    if (winnerPlayerId) {
      uiState.setLastError({ code: "GAME_RULE_ERROR", message: "La partida ya terminó." });
      return false;
    }
    if (gameStateRef.current.activePlayerId === gameStateRef.current.playerA.id) return true;
    uiState.setLastError({ code: "GAME_RULE_ERROR", message: "No es tu turno. Espera a que el rival termine su fase." });
    return false;
  }, [uiState, winnerPlayerId]);

  useOpponentTurn({
    gameState,
    isAnimating: uiState.isAnimating,
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
    gameState,
    gameStateRef,
    winnerPlayerId,
    isAnimating: uiState.isAnimating,
    isPlayerTurn,
    assertPlayerTurn,
    applyTransition,
    clearSelection: uiState.clearSelection,
    clearError: uiState.clearError,
  });

  const { toggleCardSelection, executePlayAction, handleEntityClick } = usePlayerActions({
    gameState,
    isAnimating: uiState.isAnimating,
    playingCard: uiState.playingCard,
    activeAttackerId: uiState.activeAttackerId,
    pendingEntityReplacement: uiState.pendingEntityReplacement,
    pendingFusionSummon: uiState.pendingFusionSummon,
    assertPlayerTurn,
    applyTransition,
    clearSelection: uiState.clearSelection,
    clearError: uiState.clearError,
    resolvePendingTurnAction: turnControls.resolvePendingTurnAction,
    setSelectedCard: uiState.setSelectedCard,
    setPlayingCard: uiState.setPlayingCard,
    setActiveAttackerId: uiState.setActiveAttackerId,
    setIsAnimating: uiState.setIsAnimating,
    setRevealedEntities: uiState.setRevealedEntities,
    setPendingEntityReplacement: uiState.setPendingEntityReplacement,
    setPendingFusionSummon: uiState.setPendingFusionSummon,
    setLastError: uiState.setLastError,
  });

  return buildUseBoardResult({
    gameState,
    selectedCard: uiState.selectedCard,
    playingCard: uiState.playingCard,
    isHistoryOpen: uiState.isHistoryOpen,
    activeAttackerId: uiState.activeAttackerId,
    revealedEntities: uiState.revealedEntities,
    lastError: uiState.lastError,
    pendingEntityReplacement: uiState.pendingEntityReplacement,
    opponentDifficulty,
    isPlayerTurn,
    isMuted: uiState.isMuted,
    winnerPlayerId,
    restartMatch: uiState.restartMatch,
    toggleMute: uiState.toggleMute,
    setIsHistoryOpen: uiState.setIsHistoryOpen,
    toggleCardSelection,
    previewCard: uiState.previewCard,
    clearSelection: uiState.clearSelection,
    clearError: uiState.clearError,
    executePlayAction,
    handleEntityClick,
    advancePhase: turnControls.advancePhase,
    handleTimerExpired: turnControls.handleTimerExpired,
    resolvePendingTurnAction: turnControls.resolvePendingTurnAction,
    resolvePendingHandDiscard: turnControls.resolvePendingHandDiscard,
    pendingUi,
    combatFeedback,
  });
}
