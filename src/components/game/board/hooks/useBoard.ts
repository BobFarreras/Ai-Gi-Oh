// src/components/game/board/hooks/useBoard.ts - Hook principal del tablero con soporte de mazo inicial persistido del jugador.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GameEngine, GameState } from "@/core/use-cases/GameEngine";
import { ICard } from "@/core/entities/ICard";
import { HeuristicOpponentStrategy } from "@/core/services/opponent/HeuristicOpponentStrategy";
import { resolveDifficultyFromCampaign } from "@/core/services/opponent/difficulty/resolveDifficultyFromCampaign";
import { ICampaignProgress } from "@/core/services/opponent/difficulty/types";
import { createInitialBoardState } from "./internal/boardInitialState";
import { toBoardUiError } from "./internal/boardError";
import { buildBoardCombatFeedback } from "./internal/board-state/boardCombatFeedback";
import { buildBoardPendingUi } from "./internal/board-state/boardPendingUi";
import { useBoardTurnControls } from "./internal/board-state/useBoardTurnControls";
import { useBoardUiState } from "./internal/board-state/useBoardUiState";
import { useOpponentTurn } from "./internal/useOpponentTurn";
import { usePlayerActions } from "./internal/usePlayerActions";
import { buildCardExperienceEvents } from "./internal/progression/build-card-experience-events";
import { buildPlayerCardLookup } from "./internal/progression/build-player-card-lookup";
import { buildProjectedExperienceSummary } from "./internal/progression/build-projected-experience-summary";
import { applyBattleCardExperienceAction } from "@/services/game/apply-battle-card-experience-action";
import type { IAppliedCardExperienceResult } from "@/core/use-cases/progression/ApplyBattleCardExperienceUseCase";
import { appendExperienceSummaryToCombatLog } from "./internal/progression/append-experience-combat-log";
function createBattleExperienceBatchId(): string {
  return `battle-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function resolveWinnerPlayerId(gameState: GameState): string | "DRAW" | null {
  if (gameState.playerA.healthPoints <= 0 && gameState.playerB.healthPoints <= 0) return "DRAW";
  if (gameState.playerA.healthPoints <= 0) return gameState.playerB.id;
  if (gameState.playerB.healthPoints <= 0) return gameState.playerA.id;
  return null;
}

export function useBoard(initialPlayerDeck?: ICard[]) {
  const [campaignProgress] = useState<ICampaignProgress>({ chapterIndex: 1, duelIndex: 1, victories: 0 });
  const [battleExperienceSummary, setBattleExperienceSummary] = useState<IAppliedCardExperienceResult[]>([]);
  const [isBattleExperiencePending, setIsBattleExperiencePending] = useState(false);
  const [battleId, setBattleId] = useState<string>(() => createBattleExperienceBatchId());
  const createInitialState = useCallback(
    () => createInitialBoardState({ playerDeck: initialPlayerDeck }),
    [initialPlayerDeck],
  );
  const gameStateRef = useRef<GameState>(createInitialState());
  const uiState = useBoardUiState(gameStateRef, createInitialState);
  const gameState = uiState.gameState;
  const opponentDifficulty = useMemo(() => resolveDifficultyFromCampaign(campaignProgress), [campaignProgress]);
  const opponentStrategy = useMemo(() => new HeuristicOpponentStrategy({ difficulty: opponentDifficulty }), [opponentDifficulty]);
  const isPlayerTurn = gameState.activePlayerId === gameState.playerA.id;
  const isActionLocked = uiState.isAnimating || uiState.isFusionCinematicActive || uiState.isPaused;
  const winnerPlayerId = useMemo(() => resolveWinnerPlayerId(gameState), [gameState]);
  const combatFeedback = useMemo(() => buildBoardCombatFeedback(gameState.combatLog), [gameState.combatLog]);
  const pendingUi = useMemo(
    () => buildBoardPendingUi(gameState, uiState.pendingEntityReplacement),
    [gameState, uiState.pendingEntityReplacement],
  );
  const battleExperienceCardLookup = useMemo(() => buildPlayerCardLookup(gameState.playerA), [gameState.playerA]);
  const hasAppliedBattleExperienceRef = useRef(false);
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);
  const restartMatch = useCallback(() => {
    setBattleExperienceSummary([]);
    setIsBattleExperiencePending(false);
    setBattleId(createBattleExperienceBatchId());
    uiState.restartMatch();
  }, [uiState]);
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
  const confirmEntityReplacement = useCallback(() => {
    if (!uiState.pendingEntityReplacement || !uiState.pendingEntityReplacementTargetId) return;
    const pendingReplacement = uiState.pendingEntityReplacement;
    const targetEntityId = uiState.pendingEntityReplacementTargetId;
    const replacedState = applyTransition((state) =>
      GameEngine.playCardWithEntityReplacement(
        state,
        state.playerA.id,
        pendingReplacement.cardId,
        pendingReplacement.mode,
        targetEntityId,
      ),
    );
    if (!replacedState) return;
    uiState.setPendingEntityReplacement(null);
    uiState.setPendingEntityReplacementTargetId(null);
    uiState.clearSelection();
  }, [applyTransition, uiState]);
  const cancelEntityReplacement = useCallback(() => {
    uiState.setPendingEntityReplacement(null);
    uiState.setPendingEntityReplacementTargetId(null);
    uiState.clearSelection();
  }, [uiState]);
  useEffect(() => {
    if (!winnerPlayerId) {
      hasAppliedBattleExperienceRef.current = false;
      return;
    }
    if (hasAppliedBattleExperienceRef.current) return;
    hasAppliedBattleExperienceRef.current = true;
    Promise.resolve().then(() => setIsBattleExperiencePending(true));
    const experienceEvents = buildCardExperienceEvents(gameState.combatLog, gameState.playerA.id);
    const projectedSummary = buildProjectedExperienceSummary(gameState.playerA.id, battleExperienceCardLookup, experienceEvents);
    applyBattleCardExperienceAction(battleId, experienceEvents)
      .then((summary) => {
        const resolvedSummary = summary.length > 0 ? summary : projectedSummary;
        setBattleExperienceSummary(resolvedSummary);
        if (resolvedSummary.length === 0) return;
        applyTransition((currentState) => appendExperienceSummaryToCombatLog(currentState, currentState.playerA.id, resolvedSummary));
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : "No se pudo guardar la experiencia de cartas del duelo.";
        uiState.setLastError({ code: "VALIDATION_ERROR", message });
        setBattleExperienceSummary(projectedSummary);
        if (projectedSummary.length > 0) {
          applyTransition((currentState) => appendExperienceSummaryToCombatLog(currentState, currentState.playerA.id, projectedSummary));
        }
      })
      .finally(() => {
        setIsBattleExperiencePending(false);
      });
  }, [applyTransition, battleExperienceCardLookup, battleId, gameState.combatLog, gameState.playerA, uiState, winnerPlayerId]);
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
    isAnimating: isActionLocked,
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
    selectedCard: uiState.selectedCard,
    winnerPlayerId,
    isAnimating: isActionLocked,
    isPlayerTurn,
    assertPlayerTurn,
    applyTransition,
    clearSelection: uiState.clearSelection,
    clearError: uiState.clearError,
    setActiveAttackerId: uiState.setActiveAttackerId,
    setPlayingCard: uiState.setPlayingCard,
  });
  const { toggleCardSelection, executePlayAction, handleEntityClick } = usePlayerActions({
    gameState,
    isAnimating: isActionLocked,
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
    setPlayingCard: uiState.setPlayingCard,
    setActiveAttackerId: uiState.setActiveAttackerId,
    setIsAnimating: uiState.setIsAnimating,
    setRevealedEntities: uiState.setRevealedEntities,
    setPendingEntityReplacement: uiState.setPendingEntityReplacement,
    setPendingEntityReplacementTargetId: uiState.setPendingEntityReplacementTargetId,
    setPendingFusionSummon: uiState.setPendingFusionSummon,
    setLastError: uiState.setLastError,
  });

  return {
    gameState,
    selectedCard: uiState.selectedCard,
    playingCard: uiState.playingCard,
    isHistoryOpen: uiState.isHistoryOpen,
    activeAttackerId: uiState.activeAttackerId,
    revealedEntities: uiState.revealedEntities,
    lastError: uiState.lastError,
    pendingEntityReplacement: uiState.pendingEntityReplacement,
    pendingEntityReplacementTargetId: uiState.pendingEntityReplacementTargetId,
    opponentDifficulty,
    isPlayerTurn,
    isMuted: uiState.isMuted,
    isPaused: uiState.isPaused,
    isFusionCinematicActive: uiState.isFusionCinematicActive,
    setIsFusionCinematicActive: uiState.setIsFusionCinematicActive,
    winnerPlayerId,
    restartMatch,
    toggleMute: uiState.toggleMute,
    togglePause: uiState.togglePause,
    setIsHistoryOpen: uiState.setIsHistoryOpen,
    toggleCardSelection,
    previewCard: uiState.previewCard,
    clearSelection: uiState.clearSelection,
    clearError: uiState.clearError,
    executePlayAction,
    handleEntityClick,
    advancePhase: turnControls.advancePhase,
    handleTimerExpired: turnControls.handleTimerExpired,
    confirmEntityReplacement,
    cancelEntityReplacement,
    resolvePendingTurnAction: turnControls.resolvePendingTurnAction,
    resolvePendingHandDiscard: turnControls.resolvePendingHandDiscard,
    setSelectedEntityToAttack: turnControls.setSelectedEntityToAttack,
    canSetSelectedEntityToAttack: turnControls.canSetSelectedEntityToAttack,
    battleExperienceSummary,
    battleExperienceCardLookup,
    isBattleExperiencePending,
    ...pendingUi,
    ...combatFeedback,
  };
}
