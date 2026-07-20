// src/components/game/board/hooks/useBoard.ts - Compone runtime, estado UI, progresión y audio del duelo en un contrato único para la capa visual.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GameEngine, GameState } from "@/core/use-cases/GameEngine";
import { ICard } from "@/core/entities/ICard";
import { IMatchMode } from "@/core/entities/match";
import { ICampaignProgress } from "@/core/services/opponent/difficulty/types";
import { IOpponentStrategy } from "@/core/services/opponent/types";
import { createMatchSeed } from "@/core/services/random/create-match-seed";
import { createSeededRandom } from "@/core/services/random/seeded-rng";
import { createInitialBoardState, ICreateInitialBoardStateInput } from "./internal/boardInitialState";
import { useMatchAudio } from "./internal/match/useMatchAudio";
import { useMatchProgression } from "./internal/match/useMatchProgression";
import { useMatchRuntime } from "./internal/match/useMatchRuntime";
import { useMatchUiState } from "./internal/match/useMatchUiState";
import { resolveWinnerPlayerId } from "./internal/match/board-derived-state";
import { useExecutionActivation } from "./internal/match/useExecutionActivation";
import { useRemoteOpponentAnimator } from "@/components/game/board/multiplayer/useRemoteOpponentAnimator";
import { useLocalActionEmitter } from "@/components/game/board/multiplayer/local-action-emitter";
import { REACTIVE_TRAP_DECISION_TIMEOUT_MS } from "@/components/game/board/multiplayer/reactive-trap-decision";
import { ITrapEligibleOption } from "./internal/board-state/useBoardUiState";

export function useBoard(
  initialPlayerDeck?: ICard[],
  mode: IMatchMode = "TRAINING",
  initialConfig?: ICreateInitialBoardStateInput,
  isMatchStartLocked = false,
  disableBaseSoundtrack = false,
  disableOpponentAutomation = false,
  opponentStrategyOverride: IOpponentStrategy | null = null,
  enableOpeningMulligan = false,
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
  // Mulligan de apertura (ficha 8, PvE): tras el coin toss, si el jugador tiene la habilidad y aún no decidió,
  // se ofrece rebarajar la mano 1 vez. Mientras esté pendiente, el arranque sigue "bloqueado" (la IA no juega).
  const [mulliganResolved, setMulliganResolved] = useState(false);
  const [mulliganReshuffled, setMulliganReshuffled] = useState(false);
  const isMulliganPending = enableOpeningMulligan && !isMatchStartLocked && !mulliganResolved;
  const matchStartLockedEffective = isMatchStartLocked || (enableOpeningMulligan && !mulliganResolved);
  useEffect(() => {
    if (mode !== "TUTORIAL" || !uiState.isAutoPhaseEnabled) return;
    uiState.setIsAutoPhaseEnabled(false);
  }, [mode, uiState]);
  const runtime = useMatchRuntime({
    mode,
    campaignProgress,
    gameStateRef,
    uiState,
    winnerPlayerId,
    isMatchStartLocked: matchStartLockedEffective,
    disableOpponentAutomation,
    opponentStrategyOverride,
  });
  const keepMulligan = useCallback(() => setMulliganResolved(true), []);
  const reshuffleOpeningHand = useCallback(() => {
    if (mulliganReshuffled) return;
    // Seed fresco por rebaraje (PvE, no requiere determinismo compartido): distinto orden garantizado.
    const rng = createSeededRandom(`${matchSeed}-mulligan-${Date.now()}`);
    runtime.applyTransition((state) => GameEngine.mulliganOpeningHand(state, state.playerA.id, rng));
    setMulliganReshuffled(true);
  }, [matchSeed, mulliganReshuffled, runtime]);
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
    setMulliganResolved(false);
    setMulliganReshuffled(false);
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

  // Ficha 4 (multi): el defensor recibe el ataque diferido y elige su trampa reactiva con el MISMO carrusel
  // que contra la IA (mismo `requestTrapActivationDecision`), pero con auto-pasar por timeout para no colgar
  // al atacante. El emisor viaja por contexto (noop fuera de multi).
  const emitLocalAction = useLocalActionEmitter();
  const requestReactiveTrapDecision = useCallback(
    (traps: ITrapEligibleOption[]) =>
      runtime.requestTrapActivationDecision(traps, "ON_OPPONENT_ATTACK_DECLARED", { autoPassAfterMs: REACTIVE_TRAP_DECISION_TIMEOUT_MS }),
    [runtime],
  );

  // Aplicador de acciones del rival con coreografía visual (solo se usa en multijugador).
  const applyRemoteAction = useRemoteOpponentAnimator({
    gameStateRef,
    applyTransition: runtime.applyTransition,
    setIsAnimating: uiState.setIsAnimating,
    setActiveAttackerId: uiState.setActiveAttackerId,
    setRevealedEntities: uiState.setRevealedEntities,
    clearSelection: uiState.clearSelection,
    clearError: uiState.clearError,
    setLastError: uiState.setLastError,
    requestReactiveTrapDecision,
    emitLocalAction,
  });

  return {
    applyTransition: runtime.applyTransition,
    applyRemoteAction,
    gameState: uiState.gameState,
    selectedCard: uiState.selectedCard,
    selectedBoardEntityInstanceId: uiState.selectedBoardEntityInstanceId,
    playingCard: uiState.playingCard,
    stagedCardId: uiState.stagedCardId,
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
    pausedTurnTimeouts: uiState.pausedTurnTimeouts,
    registerPausedTurnTimeout: uiState.registerPausedTurnTimeout,
    isAutoPhaseEnabled: uiState.isAutoPhaseEnabled,
    isTurnHelpEnabled: uiState.isTurnHelpEnabled,
    isFusionCinematicActive: uiState.isFusionCinematicActive,
    setIsFusionCinematicActive: uiState.setIsFusionCinematicActive,
    winnerPlayerId,
    restartMatch,
    // Mulligan de apertura (PvE): estado + acciones para el overlay pre-duelo.
    mulligan: { isPending: isMulliganPending, reshuffled: mulliganReshuffled, keep: keepMulligan, reshuffle: reshuffleOpeningHand },
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
    setSelectedEntityToDefense: runtime.setSelectedEntityToDefense,
    canSetSelectedEntityToAttack: runtime.canSetSelectedEntityToAttack,
    canSetSelectedEntityToDefense: runtime.canSetSelectedEntityToDefense,
    activateSelectedExecution,
    canActivateSelectedExecution,
    battleExperienceSummary: progression.battleExperienceSummary,
    battleExperienceCardLookup: progression.battleExperienceCardLookup,
    isBattleExperiencePending: progression.isBattleExperiencePending,
    pendingTrapActivationPrompt: runtime.pendingTrapActivationPrompt,
    activatePendingTrap: runtime.activatePendingTrap,
    skipPendingTrap: runtime.skipPendingTrap,
    cyclePendingTrap: runtime.cyclePendingTrap,
    matchSeed,
    playTimerExpired: audio.playTimerExpired,
    playTimerWarning: audio.playTimerWarning,
    playButtonClick: audio.playButtonClick,
    playBanner: audio.playBanner,
    ...uiState.pendingUi,
    ...uiState.combatFeedback,
  };
}
