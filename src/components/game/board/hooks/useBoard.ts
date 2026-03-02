import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ICard } from "@/core/entities/ICard";
import { BattleMode } from "@/core/entities/IPlayer";
import { GameEngine, GameState } from "@/core/use-cases/GameEngine";
import { HeuristicOpponentStrategy } from "@/core/services/opponent/HeuristicOpponentStrategy";
import { resolveDifficultyFromCampaign } from "@/core/services/opponent/difficulty/resolveDifficultyFromCampaign";
import { ICampaignProgress } from "@/core/services/opponent/difficulty/types";
import { initialGameState } from "./internal/boardInitialState";
import { IBoardUiError, toBoardUiError } from "./internal/boardError";
import { useOpponentTurn } from "./internal/useOpponentTurn";
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
  const [pendingEntityReplacement, setPendingEntityReplacement] = useState<{ cardId: string; mode: BattleMode } | null>(null);
  const [campaignProgress] = useState<ICampaignProgress>({ chapterIndex: 1, duelIndex: 1, victories: 0 });

  const gameStateRef = useRef(gameState);
  const opponentDifficulty = useMemo(() => resolveDifficultyFromCampaign(campaignProgress), [campaignProgress]);
  const opponentStrategy = useMemo(
    () => new HeuristicOpponentStrategy({ difficulty: opponentDifficulty }),
    [opponentDifficulty],
  );

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

  useOpponentTurn({
    gameState,
    isAnimating,
    strategy: opponentStrategy,
    applyTransition,
    clearSelection,
    clearError,
    setIsAnimating,
    setActiveAttackerId,
    setRevealedEntities,
  });

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

  const resolvePendingTurnAction = useCallback(
    (selectedId: string) => {
      if (isAnimating || !assertPlayerTurn()) {
        return;
      }

      const nextState = applyTransition((state) => GameEngine.resolvePendingTurnAction(state, state.playerA.id, selectedId));
      if (!nextState) {
        return;
      }

      clearSelection();
      clearError();
    },
    [applyTransition, assertPlayerTurn, clearError, clearSelection, isAnimating],
  );

  const resolvePendingHandDiscard = useCallback(
    (cardId: string) => {
      if (gameState.pendingTurnAction?.playerId !== gameState.playerA.id || gameState.pendingTurnAction.type !== "DISCARD_FOR_HAND_LIMIT") {
        return;
      }

      resolvePendingTurnAction(cardId);
    },
    [gameState.pendingTurnAction, gameState.playerA.id, resolvePendingTurnAction],
  );

  const { toggleCardSelection, executePlayAction, handleEntityClick } = usePlayerActions({
    gameState,
    isAnimating,
    playingCard,
    activeAttackerId,
    pendingEntityReplacement,
    assertPlayerTurn,
    applyTransition,
    clearSelection,
    clearError,
    resolvePendingTurnAction,
    setSelectedCard,
    setPlayingCard,
    setActiveAttackerId,
    setIsAnimating,
    setRevealedEntities,
    setPendingEntityReplacement,
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
    pendingEntityReplacement,
    pendingActionHint:
      gameState.pendingTurnAction?.playerId === gameState.playerA.id
        ? gameState.pendingTurnAction.type === "DISCARD_FOR_HAND_LIMIT"
          ? "Tienes 5 cartas en mano. Elige una carta de tu mano para enviarla al cementerio."
          : "Tu campo de entidades está lleno. Elige una entidad de tu campo para enviarla al cementerio."
        : pendingEntityReplacement
          ? "Tu campo está lleno. Elige una entidad del campo para reemplazarla por la nueva invocación."
          : null,
    pendingDiscardCardIds:
      gameState.pendingTurnAction?.playerId === gameState.playerA.id && gameState.pendingTurnAction.type === "DISCARD_FOR_HAND_LIMIT"
        ? gameState.playerA.hand.map((card) => card.id)
        : [],
    pendingEntitySelectionIds:
      gameState.pendingTurnAction?.playerId === gameState.playerA.id && gameState.pendingTurnAction.type === "SACRIFICE_ENTITY_FOR_DRAW"
        ? gameState.playerA.activeEntities.map((entity) => entity.instanceId)
        : pendingEntityReplacement
          ? gameState.playerA.activeEntities.map((entity) => entity.instanceId)
          : [],
    opponentDifficulty,
    isPlayerTurn: gameState.activePlayerId === gameState.playerA.id,
    setIsHistoryOpen,
    toggleCardSelection,
    clearSelection,
    clearError,
    executePlayAction,
    handleEntityClick,
    advancePhase,
    resolvePendingTurnAction,
    resolvePendingHandDiscard,
  };
}
