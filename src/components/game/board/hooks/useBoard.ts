// src/components/game/board/hooks/useBoard.ts - Compone runtime, estado UI, progresión y audio del duelo en un contrato único para la capa visual.
import { useCallback, useMemo, useRef, useState } from "react";
import { GameState } from "@/core/use-cases/GameEngine";
import { ICard } from "@/core/entities/ICard";
import { IMatchMode } from "@/core/entities/match";
import { ICampaignProgress } from "@/core/services/opponent/difficulty/types";
import { createMatchSeed } from "@/core/services/random/create-match-seed";
import { createInitialBoardState, ICreateInitialBoardStateInput } from "./internal/boardInitialState";
import { useMatchAudio } from "./internal/match/useMatchAudio";
import { useMatchProgression } from "./internal/match/useMatchProgression";
import { useMatchRuntime } from "./internal/match/useMatchRuntime";
import { useMatchUiState } from "./internal/match/useMatchUiState";

function resolveWinnerPlayerId(gameState: GameState): string | "DRAW" | null {
  if (gameState.playerA.healthPoints <= 0 && gameState.playerB.healthPoints <= 0) return "DRAW";
  if (gameState.playerA.healthPoints <= 0) return gameState.playerB.id;
  if (gameState.playerB.healthPoints <= 0) return gameState.playerA.id;
  return null;
}

export function useBoard(initialPlayerDeck?: ICard[], mode: IMatchMode = "TRAINING", initialConfig?: ICreateInitialBoardStateInput) {
  const [campaignProgress] = useState<ICampaignProgress>({ chapterIndex: 1, duelIndex: 1, victories: 0 });
  const [matchSeed] = useState(() => createMatchSeed());
  const createInitialState = useCallback(
    () => createInitialBoardState({ ...initialConfig, mode, playerDeck: initialPlayerDeck, seed: initialConfig?.seed ?? matchSeed }),
    [initialConfig, initialPlayerDeck, matchSeed, mode],
  );
  const gameStateRef = useRef<GameState>(createInitialState());
  const uiState = useMatchUiState({ gameStateRef, createInitialState });
  const winnerPlayerId = useMemo(() => resolveWinnerPlayerId(uiState.gameState), [uiState.gameState]);
  const runtime = useMatchRuntime({
    campaignProgress,
    gameStateRef,
    uiState,
    winnerPlayerId,
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
  });

  const restartMatch = useCallback(() => {
    progression.resetBattleProgression();
    uiState.restartMatch();
  }, [progression, uiState]);

  return {
    gameState: uiState.gameState,
    selectedCard: uiState.selectedCard,
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
    isFusionCinematicActive: uiState.isFusionCinematicActive,
    setIsFusionCinematicActive: uiState.setIsFusionCinematicActive,
    winnerPlayerId,
    restartMatch,
    toggleMute: uiState.toggleMute,
    togglePause: uiState.togglePause,
    setIsHistoryOpen: uiState.setIsHistoryOpen,
    toggleCardSelection: runtime.toggleCardSelection,
    previewCard: uiState.previewCard,
    clearSelection: uiState.clearSelection,
    clearError: uiState.clearError,
    executePlayAction: runtime.executePlayAction,
    handleEntityClick: runtime.handleEntityClick,
    advancePhase: runtime.advancePhase,
    handleTimerExpired: runtime.handleTimerExpired,
    confirmEntityReplacement: runtime.confirmEntityReplacement,
    cancelEntityReplacement: runtime.cancelEntityReplacement,
    resolvePendingTurnAction: runtime.resolvePendingTurnAction,
    resolvePendingHandDiscard: runtime.resolvePendingHandDiscard,
    setSelectedEntityToAttack: runtime.setSelectedEntityToAttack,
    canSetSelectedEntityToAttack: runtime.canSetSelectedEntityToAttack,
    battleExperienceSummary: progression.battleExperienceSummary,
    battleExperienceCardLookup: progression.battleExperienceCardLookup,
    isBattleExperiencePending: progression.isBattleExperiencePending,
    matchSeed,
    playTimerExpired: audio.playTimerExpired,
    playTimerWarning: audio.playTimerWarning,
    playButtonClick: audio.playButtonClick,
    ...uiState.pendingUi,
    ...uiState.combatFeedback,
  };
}
