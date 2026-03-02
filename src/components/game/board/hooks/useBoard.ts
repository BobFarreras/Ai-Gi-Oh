import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ICard } from "@/core/entities/ICard";
import { GameEngine, GameState } from "@/core/use-cases/GameEngine";
import { HeuristicOpponentStrategy } from "@/core/services/opponent/HeuristicOpponentStrategy";
import { runOpponentStep } from "@/core/services/opponent/runOpponentStep";
import { initialGameState } from "./internal/boardInitialState";
import { IBoardUiError, toBoardUiError } from "./internal/boardError";
import { usePlayerActions } from "./internal/usePlayerActions";

export function useBoard() {
  const [gameState, setGameState] = useState<GameState>(initialGameState);
  const [selectedCard, setSelectedCard] = useState<ICard | null>(null);
  const [playingCard, setPlayingCard] = useState<ICard | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [activeAttackerId, setActiveAttackerId] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [revealedEntities, setRevealedEntities] = useState<string[]>([]);
  const [lastError, setLastError] = useState<IBoardUiError | null>(null);

  const gameStateRef = useRef(gameState);
  const opponentStrategy = useMemo(() => new HeuristicOpponentStrategy(), []);

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  const clearSelection = useCallback(() => {
    setSelectedCard(null);
    setPlayingCard(null);
    setIsHistoryOpen(false);
    setActiveAttackerId(null);
  }, []);

  const clearError = useCallback(() => {
    setLastError(null);
  }, []);

  const applyTransition = useCallback((transition: (state: GameState) => GameState): GameState | null => {
    try {
      const nextState = transition(gameStateRef.current);
      gameStateRef.current = nextState;
      setGameState(nextState);
      return nextState;
    } catch (error: unknown) {
      setLastError(toBoardUiError(error));
      return null;
    }
  }, []);

  const assertPlayerTurn = useCallback((): boolean => {
    if (gameStateRef.current.activePlayerId === gameStateRef.current.playerA.id) {
      return true;
    }

    setLastError({ code: "GAME_RULE_ERROR", message: "No es tu turno. Espera a que el rival termine su fase." });
    return false;
  }, []);

  useEffect(() => {
    if (!lastError) return;
    const timeoutId = setTimeout(() => setLastError(null), 3600);
    return () => clearTimeout(timeoutId);
  }, [lastError]);

  useEffect(() => {
    if (isAnimating || gameState.activePlayerId !== gameState.playerB.id) {
      return;
    }

    const timeoutId = setTimeout(() => {
      const nextState = applyTransition((state) => runOpponentStep(state, state.playerB.id, opponentStrategy));
      if (nextState && nextState.activePlayerId === nextState.playerA.id) {
        clearSelection();
        clearError();
      }
    }, 700);

    return () => clearTimeout(timeoutId);
  }, [applyTransition, clearError, clearSelection, gameState, isAnimating, opponentStrategy]);

  const advancePhase = useCallback(() => {
    if (isAnimating || !assertPlayerTurn()) {
      return;
    }

    const nextState = applyTransition((state) => GameEngine.nextPhase(state));
    if (!nextState) {
      return;
    }

    clearSelection();
    clearError();
  }, [applyTransition, assertPlayerTurn, clearError, clearSelection, isAnimating]);

  const { toggleCardSelection, executePlayAction, handleEntityClick } = usePlayerActions({
    gameState,
    isAnimating,
    playingCard,
    activeAttackerId,
    assertPlayerTurn,
    applyTransition,
    clearSelection,
    clearError,
    setSelectedCard,
    setPlayingCard,
    setActiveAttackerId,
    setIsAnimating,
    setRevealedEntities,
    setLastError,
  });

  return {
    gameState,
    selectedCard,
    playingCard,
    isHistoryOpen,
    activeAttackerId,
    revealedEntities,
    lastError,
    isPlayerTurn: gameState.activePlayerId === gameState.playerA.id,
    setIsHistoryOpen,
    toggleCardSelection,
    clearSelection,
    clearError,
    executePlayAction,
    handleEntityClick,
    advancePhase,
  };
}
