import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ICard } from "@/core/entities/ICard";
import { BattleMode } from "@/core/entities/IPlayer";
import { GameEngine, GameState } from "@/core/use-cases/GameEngine";
import { HeuristicOpponentStrategy } from "@/core/services/opponent/HeuristicOpponentStrategy";
import { resolveDifficultyFromCampaign } from "@/core/services/opponent/difficulty/resolveDifficultyFromCampaign";
import { ICampaignProgress } from "@/core/services/opponent/difficulty/types";
import { createInitialBoardState } from "./internal/boardInitialState";
import { IBoardUiError, toBoardUiError } from "./internal/boardError";
import { useOpponentTurn } from "./internal/useOpponentTurn";
import { usePlayerActions } from "./internal/usePlayerActions";

export function useBoard() {
  const [gameState, setGameState] = useState<GameState>(() => createInitialBoardState());
  const [selectedCard, setSelectedCard] = useState<ICard | null>(null);
  const [playingCard, setPlayingCard] = useState<ICard | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [activeAttackerId, setActiveAttackerId] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isMuted, setIsMuted] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem("board-muted") === "1";
  });
  const [revealedEntities, setRevealedEntities] = useState<string[]>([]);
  const [lastError, setLastError] = useState<IBoardUiError | null>(null);
  const [pendingEntityReplacement, setPendingEntityReplacement] = useState<{ cardId: string; mode: BattleMode } | null>(null);
  const [pendingFusionSummon, setPendingFusionSummon] = useState<{ cardId: string; mode: "ATTACK" | "DEFENSE"; materials: string[] } | null>(
    null,
  );
  const [campaignProgress] = useState<ICampaignProgress>({ chapterIndex: 1, duelIndex: 1, victories: 0 });

  const gameStateRef = useRef(gameState);
  const opponentDifficulty = useMemo(() => resolveDifficultyFromCampaign(campaignProgress), [campaignProgress]);
  const opponentStrategy = useMemo(
    () => new HeuristicOpponentStrategy({ difficulty: opponentDifficulty }),
    [opponentDifficulty],
  );
  const isPlayerTurn = gameState.activePlayerId === gameState.playerA.id;
  const winnerPlayerId = useMemo(() => {
    if (gameState.playerA.healthPoints <= 0 && gameState.playerB.healthPoints <= 0) {
      return "DRAW";
    }
    if (gameState.playerA.healthPoints <= 0) {
      return gameState.playerB.id;
    }
    if (gameState.playerB.healthPoints <= 0) {
      return gameState.playerA.id;
    }
    return null;
  }, [gameState.playerA.healthPoints, gameState.playerA.id, gameState.playerB.healthPoints, gameState.playerB.id]);
  const lastDamageEvent = useMemo(
    () =>
      [...gameState.combatLog]
        .reverse()
        .find((event) => event.eventType === "DIRECT_DAMAGE" && typeof event.payload === "object" && event.payload !== null),
    [gameState.combatLog],
  );
  const lastHealEvent = useMemo(
    () =>
      [...gameState.combatLog]
        .reverse()
        .find((event) => event.eventType === "HEAL_APPLIED" && typeof event.payload === "object" && event.payload !== null),
    [gameState.combatLog],
  );
  const lastStatBuffEvent = useMemo(
    () =>
      [...gameState.combatLog]
        .reverse()
        .find((event) => event.eventType === "STAT_BUFF_APPLIED" && typeof event.payload === "object" && event.payload !== null),
    [gameState.combatLog],
  );

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

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

  const clearError = useCallback(() => {
    setLastError(null);
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((previous) => {
      const next = !previous;
      if (typeof window !== "undefined") {
        window.localStorage.setItem("board-muted", next ? "1" : "0");
      }
      return next;
    });
  }, []);

  const restartMatch = useCallback(() => {
    const freshState = createInitialBoardState();
    setGameState(freshState);
    gameStateRef.current = freshState;
    clearSelection();
    clearError();
  }, [clearError, clearSelection]);

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
    if (winnerPlayerId) {
      setLastError({ code: "GAME_RULE_ERROR", message: "La partida ya terminó." });
      return false;
    }

    if (gameStateRef.current.activePlayerId === gameStateRef.current.playerA.id) {
      return true;
    }

    setLastError({ code: "GAME_RULE_ERROR", message: "No es tu turno. Espera a que el rival termine su fase." });
    return false;
  }, [winnerPlayerId]);

  useEffect(() => {
    if (!lastError) return;
    const timeoutId = setTimeout(() => setLastError(null), 3600);
    return () => clearTimeout(timeoutId);
  }, [lastError]);

  useOpponentTurn({
    gameState,
    isAnimating,
    strategy: opponentStrategy,
    duelWinnerId: winnerPlayerId,
    applyTransition,
    clearSelection,
    clearError,
    setIsAnimating,
    setActiveAttackerId,
    setRevealedEntities,
  });

  const advancePhase = useCallback(() => {
    if (winnerPlayerId || isAnimating || !assertPlayerTurn()) {
      return;
    }

    const nextState = applyTransition((state) => GameEngine.nextPhase(state));
    if (!nextState) {
      return;
    }

    clearSelection();
    clearError();
  }, [applyTransition, assertPlayerTurn, clearError, clearSelection, isAnimating, winnerPlayerId]);

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

  const handleTimerExpired = useCallback(() => {
    if (winnerPlayerId || !isPlayerTurn || isAnimating) {
      return;
    }

    const pendingAction = gameStateRef.current.pendingTurnAction;
    if (pendingAction?.playerId === gameStateRef.current.playerA.id) {
      if (pendingAction.type === "DISCARD_FOR_HAND_LIMIT") {
        const leftmostCard = gameStateRef.current.playerA.hand[0];
        if (leftmostCard) {
          resolvePendingTurnAction(leftmostCard.id);
        }
        return;
      }

      const oldestEntity = gameStateRef.current.playerA.activeEntities[0];
      if (oldestEntity) {
        resolvePendingTurnAction(oldestEntity.instanceId);
      }
      return;
    }

    advancePhase();
  }, [advancePhase, isAnimating, isPlayerTurn, resolvePendingTurnAction, winnerPlayerId]);

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
    pendingFusionSummon,
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
    setPendingFusionSummon,
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
        : pendingFusionSummon
          ? `Selecciona 2 materiales para fusionar (${pendingFusionSummon.materials.length}/2).`
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
        : pendingFusionSummon
          ? gameState.playerA.activeEntities.map((entity) => entity.instanceId)
        : pendingEntityReplacement
          ? gameState.playerA.activeEntities.map((entity) => entity.instanceId)
          : [],
    opponentDifficulty,
    isPlayerTurn,
    isMuted,
    winnerPlayerId,
    lastDamageTargetPlayerId:
      lastDamageEvent && typeof lastDamageEvent.payload === "object" && lastDamageEvent.payload !== null && "targetPlayerId" in lastDamageEvent.payload
        ? String(lastDamageEvent.payload.targetPlayerId)
        : null,
    lastDamageAmount:
      lastDamageEvent && typeof lastDamageEvent.payload === "object" && lastDamageEvent.payload !== null && "amount" in lastDamageEvent.payload
        ? Number(lastDamageEvent.payload.amount)
        : null,
    lastDamageEventId: lastDamageEvent?.id ?? null,
    lastHealTargetPlayerId:
      lastHealEvent && typeof lastHealEvent.payload === "object" && lastHealEvent.payload !== null && "targetPlayerId" in lastHealEvent.payload
        ? String(lastHealEvent.payload.targetPlayerId)
        : null,
    lastHealAmount:
      lastHealEvent && typeof lastHealEvent.payload === "object" && lastHealEvent.payload !== null && "amount" in lastHealEvent.payload
        ? Number(lastHealEvent.payload.amount)
        : null,
    lastHealEventId: lastHealEvent?.id ?? null,
    lastBuffTargetEntityIds:
      lastStatBuffEvent &&
      typeof lastStatBuffEvent.payload === "object" &&
      lastStatBuffEvent.payload !== null &&
      "targetEntityIds" in lastStatBuffEvent.payload &&
      Array.isArray(lastStatBuffEvent.payload.targetEntityIds)
        ? lastStatBuffEvent.payload.targetEntityIds
            .map((value) => (typeof value === "string" ? value : null))
            .filter((value): value is string => value !== null)
        : [],
    lastBuffStat:
      lastStatBuffEvent &&
      typeof lastStatBuffEvent.payload === "object" &&
      lastStatBuffEvent.payload !== null &&
      "stat" in lastStatBuffEvent.payload
        ? String(lastStatBuffEvent.payload.stat)
        : null,
    lastBuffAmount:
      lastStatBuffEvent &&
      typeof lastStatBuffEvent.payload === "object" &&
      lastStatBuffEvent.payload !== null &&
      "amount" in lastStatBuffEvent.payload
        ? Number(lastStatBuffEvent.payload.amount)
        : null,
    lastBuffEventId: lastStatBuffEvent?.id ?? null,
    restartMatch,
    toggleMute,
    setIsHistoryOpen,
    toggleCardSelection,
    previewCard,
    clearSelection,
    clearError,
    executePlayAction,
    handleEntityClick,
    advancePhase,
    handleTimerExpired,
    resolvePendingTurnAction,
    resolvePendingHandDiscard,
  };
}
