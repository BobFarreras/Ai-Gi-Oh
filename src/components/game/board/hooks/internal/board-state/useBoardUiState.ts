// src/components/game/board/hooks/internal/board-state/useBoardUiState.ts - Gestiona estado UI local del tablero y flujos pendientes de interacción.
import { MutableRefObject, useCallback, useRef, useState } from "react";
import { ICard } from "@/core/entities/ICard";
import { GameState } from "@/core/use-cases/GameEngine";
import { IBoardUiError } from "../boardError";
import { IPendingZoneReplacement } from "./pending-replacement";
import { useBoardStateSelector, useLocalBoardStateStore } from "./board-state-store";

export type TrapDecisionTrigger = "ON_OPPONENT_ATTACK_DECLARED" | "ON_OPPONENT_EXECUTION_ACTIVATED" | "ON_OPPONENT_TRAP_ACTIVATED";

/** Una trampa candidata a activarse ante un disparo (ficha 4): su carta para previsualizar + su instanceId. */
export interface ITrapEligibleOption {
  card: ICard;
  instanceId: string;
}

/** Decisión del jugador reactivo: activar (con la trampa elegida) o pasar. */
export interface ITrapActivationDecision {
  activate: boolean;
  chosenTrapInstanceId?: string;
}

export interface ITrapActivationPrompt {
  trigger: TrapDecisionTrigger;
  /** Carta actualmente en el carrusel (= eligibleTraps[currentIndex].card). Se conserva para el detalle. */
  trapCard: ICard;
  /** Todas las trampas elegibles para este disparo, en orden de colocación (ficha 4). */
  eligibleTraps: ITrapEligibleOption[];
  /** Índice de la trampa mostrada en el carrusel. */
  currentIndex: number;
}

export function useBoardUiState(
  gameStateRef: MutableRefObject<GameState>,
  createInitialState: () => GameState,
) {
  // gameState vive en un store Zustand local: habilita suscripciones por selector sin cambiar el contrato.
  const gameStateStore = useLocalBoardStateStore(createInitialState);
  const gameState = useBoardStateSelector(gameStateStore, (state) => state.gameState);
  const setGameState = useCallback((value: GameState) => gameStateStore.setState({ gameState: value }), [gameStateStore]);
  const [selectedCard, setSelectedCard] = useState<ICard | null>(null);
  const [selectedBoardEntityInstanceId, setSelectedBoardEntityInstanceId] = useState<string | null>(null);
  const [playingCard, setPlayingCard] = useState<ICard | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [activeAttackerId, setActiveAttackerId] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [revealedEntities, setRevealedEntities] = useState<string[]>([]);
  const [lastError, setLastError] = useState<IBoardUiError | null>(null);
  const [pendingEntityReplacement, setPendingEntityReplacement] = useState<IPendingZoneReplacement | null>(null);
  const [pendingEntityReplacementTargetId, setPendingEntityReplacementTargetId] = useState<string | null>(null);
  /** ID de la carta de mano staged para reemplazo de zona. Se muestra con borde sutil en vez de selección completa. */
  const [stagedCardId, setStagedCardId] = useState<string | null>(null);
  const [pendingFusionSummon, setPendingFusionSummon] = useState<{ cardId: string; mode: "ATTACK" | "DEFENSE"; materials: string[] } | null>(null);
  const [pendingTrapActivationPrompt, setPendingTrapActivationPrompt] = useState<ITrapActivationPrompt | null>(null);
  const [isFusionCinematicActive, setIsFusionCinematicActive] = useState(false);
  const [isMuted, setIsMuted] = useState<boolean>(() => (typeof window !== "undefined" ? window.localStorage.getItem("board-muted") === "1" : false));
  const [isPaused, setIsPaused] = useState(false);
  // Multi: nº de turnos propios que se han auto-pasado estando en pausa (anti-AFK). Se reinicia al reanudar.
  // El ref es la fuente de verdad para la lógica (lectura síncrona en el timeout); el estado solo alimenta la UI.
  const [pausedTurnTimeouts, setPausedTurnTimeouts] = useState(0);
  const pausedTurnTimeoutsRef = useRef(0);
  const [isAutoPhaseEnabled, setIsAutoPhaseEnabled] = useState<boolean>(() => (typeof window !== "undefined" ? window.localStorage.getItem("board-auto-phase") !== "0" : true));
  const [isTurnHelpEnabled, setIsTurnHelpEnabled] = useState<boolean>(() => (typeof window !== "undefined" ? window.localStorage.getItem("board-turn-help") !== "0" : true));

  const clearSelection = useCallback(() => {
    setSelectedCard(null);
    setSelectedBoardEntityInstanceId(null);
    setPlayingCard(null);
    setActiveAttackerId(null);
    setPendingEntityReplacementTargetId(null);
    setPendingFusionSummon(null);
    setStagedCardId(null);
  }, []);

  const previewCard = useCallback((card: ICard) => {
    setSelectedCard(card);
    setSelectedBoardEntityInstanceId(null);
    setPlayingCard(null);
    setActiveAttackerId(null);
  }, []);

  const clearError = useCallback(() => setLastError(null), []);

  const toggleMute = useCallback(() => {
    setIsMuted((previous) => {
      const next = !previous;
      if (typeof window !== "undefined") {
        window.localStorage.setItem("board-muted", next ? "1" : "0");
        window.dispatchEvent(new CustomEvent("board-muted-changed", { detail: { isMuted: next } }));
      }
      return next;
    });
  }, []);
  const togglePause = useCallback(() => {
    setIsPaused((previous) => {
      // Reanudar (pausa→activa) reinicia el contador anti-AFK: solo penaliza permanecer en pausa de forma continua.
      if (previous) {
        pausedTurnTimeoutsRef.current = 0;
        setPausedTurnTimeouts(0);
      }
      return !previous;
    });
  }, []);
  /** Multi: registra un turno propio auto-pasado en pausa y devuelve el nuevo total (para decidir el forfeit). */
  const registerPausedTurnTimeout = useCallback(() => {
    pausedTurnTimeoutsRef.current += 1;
    setPausedTurnTimeouts(pausedTurnTimeoutsRef.current);
    return pausedTurnTimeoutsRef.current;
  }, []);
  const toggleAutoPhase = useCallback(() => {
    setIsAutoPhaseEnabled((previous) => {
      const next = !previous;
      if (typeof window !== "undefined") window.localStorage.setItem("board-auto-phase", next ? "1" : "0");
      return next;
    });
  }, []);
  const disableTurnHelp = useCallback(() => {
    setIsTurnHelpEnabled(false);
    if (typeof window !== "undefined") window.localStorage.setItem("board-turn-help", "0");
  }, []);

  const restartMatch = useCallback(() => {
    const freshState = createInitialState();
    setGameState(freshState);
    gameStateRef.current = freshState;
    clearSelection();
    clearError();
    setIsPaused(false);
    pausedTurnTimeoutsRef.current = 0;
    setPausedTurnTimeouts(0);
  }, [clearError, clearSelection, createInitialState, gameStateRef, setGameState]);

  return {
    gameState,
    gameStateStore,
    setGameState,
    selectedCard,
    setSelectedCard,
    selectedBoardEntityInstanceId,
    setSelectedBoardEntityInstanceId,
    playingCard,
    setPlayingCard,
    isHistoryOpen,
    setIsHistoryOpen,
    activeAttackerId,
    setActiveAttackerId,
    isAnimating,
    setIsAnimating,
    revealedEntities,
    setRevealedEntities,
    lastError,
    setLastError,
    pendingEntityReplacement,
    setPendingEntityReplacement,
    pendingEntityReplacementTargetId,
    setPendingEntityReplacementTargetId,
    stagedCardId,
    setStagedCardId,
    pendingFusionSummon,
    setPendingFusionSummon,
    pendingTrapActivationPrompt,
    setPendingTrapActivationPrompt,
    isFusionCinematicActive,
    setIsFusionCinematicActive,
    isMuted,
    setIsMuted,
    isPaused,
    setIsPaused,
    pausedTurnTimeouts,
    registerPausedTurnTimeout,
    isAutoPhaseEnabled,
    setIsAutoPhaseEnabled,
    toggleAutoPhase,
    isTurnHelpEnabled,
    setIsTurnHelpEnabled,
    disableTurnHelp,
    clearSelection,
    previewCard,
    clearError,
    toggleMute,
    togglePause,
    restartMatch,
  };
}
