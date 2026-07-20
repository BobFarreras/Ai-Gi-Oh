// src/components/game/board/hooks/internal/board-state/useBoardTurnControls.ts - Centraliza controles de fase, timer y resolución de acciones pendientes del jugador.
import { MutableRefObject, useCallback } from "react";
import { ICard } from "@/core/entities/ICard";
import { IMatchMode } from "@/core/entities/match";
import { GameEngine, GameState } from "@/core/use-cases/GameEngine";
import { useLocalActionEmitter } from "@/components/game/board/multiplayer/local-action-emitter";
import { useAutoAdvanceBattle } from "./useAutoAdvanceBattle";
import { useAdvancePhaseGuard } from "./useAdvancePhaseGuard";
import { useHandleTimerExpired } from "./useHandleTimerExpired";
import { useSelectedEntityModeActions } from "./useSelectedEntityModeActions";
import { useTurnTelemetry } from "./useTurnTelemetry";

interface IUseBoardTurnControlsParams {
  mode: IMatchMode;
  gameState: GameState;
  gameStateRef: MutableRefObject<GameState>;
  selectedCard: ICard | null;
  winnerPlayerId: string | "DRAW" | null;
  isAnimating: boolean;
  /** Lock SIN pausa (animación/cinemática reales): lo usa el timeout de turno para poder auto-pasar en pausa. */
  animationLock: boolean;
  isPlayerTurn: boolean;
  isAutoPhaseEnabled: boolean;
  isTurnHelpEnabled: boolean;
  assertPlayerTurn: () => boolean;
  applyTransition: (transition: (state: GameState) => GameState) => GameState | null;
  clearSelection: () => void;
  clearError: () => void;
  disableTurnHelp: () => void;
  setActiveAttackerId: (value: string | null) => void;
  setPlayingCard: (card: ICard | null) => void;
}

interface IUseBoardTurnControlsResult {
  advancePhase: () => void;
  confirmAdvancePhase: (disableHelp: boolean) => void;
  cancelAdvancePhase: () => void;
  pendingAdvanceWarning: "MAIN_SKIP_ACTIONS" | "BATTLE_SKIP_ATTACKS" | null;
  resolvePendingTurnAction: (selectedId: string) => void;
  handleTimerExpired: () => void;
  resolvePendingHandDiscard: (cardId: string) => void;
  setSelectedEntityToAttack: () => void;
  setSelectedEntityToDefense: () => void;
  canSetSelectedEntityToAttack: boolean;
  canSetSelectedEntityToDefense: boolean;
}

export function useBoardTurnControls({
  mode,
  gameState,
  gameStateRef,
  selectedCard,
  winnerPlayerId,
  isAnimating,
  animationLock,
  isPlayerTurn,
  isAutoPhaseEnabled,
  isTurnHelpEnabled,
  assertPlayerTurn,
  applyTransition,
  clearSelection,
  clearError,
  disableTurnHelp,
  setActiveAttackerId,
  setPlayingCard,
}: IUseBoardTurnControlsParams): IUseBoardTurnControlsResult {
  const emitLocalAction = useLocalActionEmitter();
  const telemetry = useTurnTelemetry({ applyTransition });
  const { canSetSelectedEntityToAttack, canSetSelectedEntityToDefense, setSelectedEntityToAttack, setSelectedEntityToDefense } =
    useSelectedEntityModeActions({
      gameState,
      selectedCard,
      winnerPlayerId,
      isAnimating,
      isPlayerTurn,
      assertPlayerTurn,
      applyTransition,
      clearError,
      setActiveAttackerId,
      setPlayingCard,
    });

  const resolvePendingTurnAction = useCallback(
    (selectedId: string) => {
      if (isAnimating || !assertPlayerTurn()) return;
      const nextState = applyTransition((state) => GameEngine.resolvePendingTurnAction(state, state.playerA.id, selectedId));
      if (!nextState) return;
      clearSelection();
      clearError();
      // Crítico para el flujo de turno: el descarte obligatorio por límite de mano
      // (y otras selecciones) DEBE sincronizarse, o el rival se queda con la acción
      // pendiente y el turno nunca avanza (deadlock).
      emitLocalAction({ type: "RESOLVE_PENDING_TURN_ACTION", payload: { selectedId } });
    },
    [applyTransition, assertPlayerTurn, clearError, clearSelection, emitLocalAction, isAnimating],
  );

  const executeAdvancePhase = useCallback(() => {
    if (winnerPlayerId || isAnimating || !assertPlayerTurn()) return;
    const nextState = applyTransition((state) => GameEngine.nextPhase(state));
    if (!nextState) return;
    clearSelection();
    clearError();
    emitLocalAction({ type: "NEXT_PHASE", payload: {} });
  }, [applyTransition, assertPlayerTurn, clearError, clearSelection, emitLocalAction, isAnimating, winnerPlayerId]);
  const { advancePhase, confirmAdvancePhase, cancelAdvancePhase, pendingAdvanceWarning } = useAdvancePhaseGuard({
    mode,
    gameState,
    winnerPlayerId,
    isAnimating,
    isTurnHelpEnabled,
    assertPlayerTurn,
    executeAdvancePhase,
    disableTurnHelp,
    onGuardShown: telemetry.logTurnGuardShown,
    onGuardConfirmed: telemetry.logTurnGuardConfirmed,
    onGuardCancelled: telemetry.logTurnGuardCancelled,
  });

  useAutoAdvanceBattle({
    mode,
    gameState,
    gameStateRef,
    winnerPlayerId,
    isAnimating,
    isPlayerTurn,
    isAutoPhaseEnabled,
    advancePhase: executeAdvancePhase,
    onAutoAdvanced: telemetry.logAutoPhaseAdvanced,
  });

  // Variantes del timeout que usan `animationLock` (sin pausa) en vez de `isAnimating` (con pausa): así el
  // auto-pase anti-AFK funciona aunque el jugador esté en pausa, pero sigue respetando animaciones reales.
  // Los controles del jugador (botón/auto-avance) siguen usando las versiones con pausa de arriba.
  const advancePhaseOnTimeout = useCallback(() => {
    if (winnerPlayerId || animationLock || !assertPlayerTurn()) return;
    const nextState = applyTransition((state) => GameEngine.nextPhase(state));
    if (!nextState) return;
    clearSelection();
    clearError();
    emitLocalAction({ type: "NEXT_PHASE", payload: {} });
  }, [animationLock, applyTransition, assertPlayerTurn, clearError, clearSelection, emitLocalAction, winnerPlayerId]);

  const resolvePendingTurnActionOnTimeout = useCallback(
    (selectedId: string) => {
      if (animationLock || !assertPlayerTurn()) return;
      const nextState = applyTransition((state) => GameEngine.resolvePendingTurnAction(state, state.playerA.id, selectedId));
      if (!nextState) return;
      clearSelection();
      clearError();
      emitLocalAction({ type: "RESOLVE_PENDING_TURN_ACTION", payload: { selectedId } });
    },
    [animationLock, applyTransition, assertPlayerTurn, clearError, clearSelection, emitLocalAction],
  );

  const handleTimerExpired = useHandleTimerExpired({
    gameStateRef,
    isAnimating: animationLock,
    executeAdvancePhase: advancePhaseOnTimeout,
    resolvePendingTurnAction: resolvePendingTurnActionOnTimeout,
    // Multi: el timeout cede el turno entero al rival ("cambiar al otro jugador"), no solo una fase.
    endEntireTurn: mode === "MULTIPLAYER",
  });

  const resolvePendingHandDiscard = useCallback(
    (cardId: string) => {
      if (gameState.pendingTurnAction?.playerId !== gameState.playerA.id || gameState.pendingTurnAction.type !== "DISCARD_FOR_HAND_LIMIT") return;
      resolvePendingTurnAction(cardId);
    },
    [gameState.pendingTurnAction, gameState.playerA.id, resolvePendingTurnAction],
  );

  return {
    advancePhase,
    confirmAdvancePhase,
    cancelAdvancePhase,
    pendingAdvanceWarning,
    resolvePendingTurnAction,
    handleTimerExpired,
    resolvePendingHandDiscard,
    setSelectedEntityToAttack,
    setSelectedEntityToDefense,
    canSetSelectedEntityToAttack,
    canSetSelectedEntityToDefense,
  };
}
