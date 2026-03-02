import { useCallback } from "react";
import { ICard } from "@/core/entities/ICard";
import { BattleMode, IBoardEntity } from "@/core/entities/IPlayer";
import { GameEngine, GameState } from "@/core/use-cases/GameEngine";
import { IBoardUiError } from "./boardError";
import { sleep } from "./sleep";

interface IUsePlayerActionsParams {
  gameState: GameState;
  isAnimating: boolean;
  playingCard: ICard | null;
  activeAttackerId: string | null;
  assertPlayerTurn: () => boolean;
  applyTransition: (transition: (state: GameState) => GameState) => GameState | null;
  clearSelection: () => void;
  clearError: () => void;
  setSelectedCard: (card: ICard | null) => void;
  setPlayingCard: (card: ICard | null) => void;
  setActiveAttackerId: (value: string | null | ((prev: string | null) => string | null)) => void;
  setIsAnimating: (value: boolean) => void;
  setRevealedEntities: (value: string[] | ((prev: string[]) => string[])) => void;
  setLastError: (value: IBoardUiError | null) => void;
}

interface IPlayerActions {
  toggleCardSelection: (card: ICard, event?: React.MouseEvent) => void;
  executePlayAction: (mode: BattleMode, event: React.MouseEvent) => Promise<void>;
  handleEntityClick: (entity: IBoardEntity | null, isOpponent: boolean, event: React.MouseEvent) => Promise<void>;
}

export function usePlayerActions({
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
}: IUsePlayerActionsParams): IPlayerActions {
  const toggleCardSelection = useCallback(
    (card: ICard, event?: React.MouseEvent) => {
      event?.stopPropagation();
      if (isAnimating || !assertPlayerTurn()) return;
      if (playingCard?.id === card.id) {
        clearSelection();
      } else {
        setSelectedCard(card);
        setPlayingCard(card);
        setActiveAttackerId(null);
      }
      clearError();
    },
    [assertPlayerTurn, clearError, clearSelection, isAnimating, playingCard?.id, setActiveAttackerId, setPlayingCard, setSelectedCard],
  );

  const executePlayAction = useCallback(
    async (mode: BattleMode, event: React.MouseEvent) => {
      event.stopPropagation();
      if (!playingCard || isAnimating || !assertPlayerTurn()) return;

      clearError();
      if (mode === "ACTIVATE") {
        setIsAnimating(true);
        const playedState = applyTransition((state) => GameEngine.playCard(state, state.playerA.id, playingCard.id, mode));
        if (!playedState) {
          setIsAnimating(false);
          return;
        }

        const executionId = playedState.playerA.activeExecutions.at(-1)?.instanceId;
        if (!executionId) {
          setLastError({ code: "NOT_FOUND_ERROR", message: "No se pudo localizar la ejecución recién activada." });
          setIsAnimating(false);
          return;
        }

        clearSelection();
        await sleep(1500);
        applyTransition((state) => GameEngine.resolveExecution(state, state.playerA.id, executionId));
        setIsAnimating(false);
        return;
      }

      const played = applyTransition((state) => GameEngine.playCard(state, state.playerA.id, playingCard.id, mode));
      if (played) clearSelection();
    },
    [applyTransition, assertPlayerTurn, clearError, clearSelection, isAnimating, playingCard, setIsAnimating, setLastError],
  );

  const handleEntityClick = useCallback(
    async (entity: IBoardEntity | null, isOpponent: boolean, event: React.MouseEvent) => {
      event.stopPropagation();
      if (isAnimating || !assertPlayerTurn()) return;

      clearError();
      if (!isOpponent) {
        if (!entity) return;

        if (entity.card.type === "EXECUTION" && entity.mode === "SET") {
          setIsAnimating(true);
          const activated = applyTransition((state) =>
            GameEngine.changeEntityMode(state, state.playerA.id, entity.instanceId, "ACTIVATE"),
          );
          if (!activated) {
            setIsAnimating(false);
            return;
          }
          clearSelection();
          await sleep(1500);
          applyTransition((state) => GameEngine.resolveExecution(state, state.playerA.id, entity.instanceId));
          setIsAnimating(false);
          return;
        }

        if (gameState.phase !== "BATTLE") {
          setSelectedCard(entity.card);
          return;
        }

        if (entity.mode !== "ATTACK" || entity.hasAttackedThisTurn) return;
        setActiveAttackerId((previous) => (previous === entity.instanceId ? null : entity.instanceId));
        setSelectedCard(entity.card);
        setPlayingCard(null);
        return;
      }

      if (activeAttackerId) {
        setIsAnimating(true);
        const targetId = entity?.instanceId;
        setActiveAttackerId(null);
        clearSelection();

        if (entity && (entity.mode === "DEFENSE" || entity.mode === "SET") && targetId) {
          setRevealedEntities((previous) => [...previous, targetId]);
          await sleep(800);
        }

        applyTransition((state) => GameEngine.executeAttack(state, state.playerA.id, activeAttackerId, targetId));
        if (targetId) {
          setRevealedEntities((previous) => previous.filter((id) => id !== targetId));
        }
        setIsAnimating(false);
        return;
      }

      if (entity) setSelectedCard(entity.card);
    },
    [
      activeAttackerId,
      applyTransition,
      assertPlayerTurn,
      clearError,
      clearSelection,
      gameState.phase,
      isAnimating,
      setActiveAttackerId,
      setIsAnimating,
      setPlayingCard,
      setRevealedEntities,
      setSelectedCard,
    ],
  );

  return { toggleCardSelection, executePlayAction, handleEntityClick };
}
