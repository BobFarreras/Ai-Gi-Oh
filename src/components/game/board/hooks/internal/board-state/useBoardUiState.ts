// src/components/game/board/hooks/internal/board-state/useBoardUiState.ts - Gestiona estado UI local del tablero y flujos pendientes de interacción.
import { MutableRefObject, useCallback, useState } from "react";
import { ICard } from "@/core/entities/ICard";
import { GameState } from "@/core/use-cases/GameEngine";
import { IBoardUiError } from "../boardError";
import { IPendingZoneReplacement } from "./pending-replacement";

export interface ITrapActivationPrompt {
  trigger: "ON_OPPONENT_ATTACK_DECLARED" | "ON_OPPONENT_EXECUTION_ACTIVATED" | "ON_OPPONENT_TRAP_ACTIVATED";
  trapCard: ICard;
}

export function useBoardUiState(
  gameStateRef: MutableRefObject<GameState>,
  createInitialState: () => GameState,
) {
  const [gameState, setGameState] = useState<GameState>(() => createInitialState());
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
  const [pendingFusionSummon, setPendingFusionSummon] = useState<{ cardId: string; mode: "ATTACK" | "DEFENSE"; materials: string[] } | null>(null);
  const [pendingTrapActivationPrompt, setPendingTrapActivationPrompt] = useState<ITrapActivationPrompt | null>(null);
  const [isFusionCinematicActive, setIsFusionCinematicActive] = useState(false);
  const [isMuted, setIsMuted] = useState<boolean>(() => (typeof window !== "undefined" ? window.localStorage.getItem("board-muted") === "1" : false));
  const [isPaused, setIsPaused] = useState(false);
  const [isAutoPhaseEnabled, setIsAutoPhaseEnabled] = useState<boolean>(() => (typeof window !== "undefined" ? window.localStorage.getItem("board-auto-phase") !== "0" : true));
  const [isTurnHelpEnabled, setIsTurnHelpEnabled] = useState<boolean>(() => (typeof window !== "undefined" ? window.localStorage.getItem("board-turn-help") !== "0" : true));

  const clearSelection = useCallback(() => {
    setSelectedCard(null);
    setSelectedBoardEntityInstanceId(null);
    setPlayingCard(null);
    setActiveAttackerId(null);
    setPendingEntityReplacementTargetId(null);
    setPendingFusionSummon(null);
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
    setIsPaused((previous) => !previous);
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
  }, [clearError, clearSelection, createInitialState, gameStateRef]);

  return {
    gameState,
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
