import { MutableRefObject, useCallback, useState } from "react";
import { ICard } from "@/core/entities/ICard";
import { BattleMode } from "@/core/entities/IPlayer";
import { GameState } from "@/core/use-cases/GameEngine";
import { IBoardUiError } from "../boardError";

interface IUseBoardUiStateResult {
  gameState: GameState;
  setGameState: (value: GameState) => void;
  selectedCard: ICard | null;
  setSelectedCard: (value: ICard | null) => void;
  playingCard: ICard | null;
  setPlayingCard: (value: ICard | null) => void;
  isHistoryOpen: boolean;
  setIsHistoryOpen: (value: boolean | ((previous: boolean) => boolean)) => void;
  activeAttackerId: string | null;
  setActiveAttackerId: (value: string | null | ((previous: string | null) => string | null)) => void;
  isAnimating: boolean;
  setIsAnimating: (value: boolean) => void;
  revealedEntities: string[];
  setRevealedEntities: (value: string[] | ((previous: string[]) => string[])) => void;
  lastError: IBoardUiError | null;
  setLastError: (value: IBoardUiError | null) => void;
  pendingEntityReplacement: { cardId: string; mode: BattleMode } | null;
  setPendingEntityReplacement: (value: { cardId: string; mode: BattleMode } | null) => void;
  pendingFusionSummon: { cardId: string; mode: "ATTACK" | "DEFENSE"; materials: string[] } | null;
  setPendingFusionSummon: (value: { cardId: string; mode: "ATTACK" | "DEFENSE"; materials: string[] } | null) => void;
  isFusionCinematicActive: boolean;
  setIsFusionCinematicActive: (value: boolean) => void;
  isMuted: boolean;
  setIsMuted: (value: boolean | ((previous: boolean) => boolean)) => void;
  isPaused: boolean;
  setIsPaused: (value: boolean | ((previous: boolean) => boolean)) => void;
  clearSelection: () => void;
  previewCard: (card: ICard) => void;
  clearError: () => void;
  toggleMute: () => void;
  togglePause: () => void;
  restartMatch: () => void;
}

export function useBoardUiState(
  gameStateRef: MutableRefObject<GameState>,
  createInitialState: () => GameState,
): IUseBoardUiStateResult {
  const [gameState, setGameState] = useState<GameState>(() => createInitialState());
  const [selectedCard, setSelectedCard] = useState<ICard | null>(null);
  const [playingCard, setPlayingCard] = useState<ICard | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [activeAttackerId, setActiveAttackerId] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [revealedEntities, setRevealedEntities] = useState<string[]>([]);
  const [lastError, setLastError] = useState<IBoardUiError | null>(null);
  const [pendingEntityReplacement, setPendingEntityReplacement] = useState<{ cardId: string; mode: BattleMode } | null>(null);
  const [pendingFusionSummon, setPendingFusionSummon] = useState<{ cardId: string; mode: "ATTACK" | "DEFENSE"; materials: string[] } | null>(null);
  const [isFusionCinematicActive, setIsFusionCinematicActive] = useState(false);
  const [isMuted, setIsMuted] = useState<boolean>(() => (typeof window !== "undefined" ? window.localStorage.getItem("board-muted") === "1" : false));
  const [isPaused, setIsPaused] = useState(false);

  const clearSelection = useCallback(() => {
    setSelectedCard(null);
    setPlayingCard(null);
    setActiveAttackerId(null);
    setPendingFusionSummon(null);
  }, []);

  const previewCard = useCallback((card: ICard) => {
    setSelectedCard(card);
    setPlayingCard(null);
    setActiveAttackerId(null);
  }, []);

  const clearError = useCallback(() => setLastError(null), []);

  const toggleMute = useCallback(() => {
    setIsMuted((previous) => {
      const next = !previous;
      if (typeof window !== "undefined") window.localStorage.setItem("board-muted", next ? "1" : "0");
      return next;
    });
  }, []);
  const togglePause = useCallback(() => {
    setIsPaused((previous) => !previous);
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
    pendingFusionSummon,
    setPendingFusionSummon,
    isFusionCinematicActive,
    setIsFusionCinematicActive,
    isMuted,
    setIsMuted,
    isPaused,
    setIsPaused,
    clearSelection,
    previewCard,
    clearError,
    toggleMute,
    togglePause,
    restartMatch,
  };
}
