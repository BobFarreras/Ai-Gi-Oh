import { useCallback } from "react";
import { ICard } from "@/core/entities/ICard";
import { BattleMode, IBoardEntity } from "@/core/entities/IPlayer";
import { GameEngine, GameState } from "@/core/use-cases/GameEngine";
import { IBoardUiError } from "./boardError";
import { sleep } from "./sleep";
import { addRevealedId, findReactiveTrap, removeRevealedId } from "./trapPreview";

interface IUsePlayerActionsParams {
  gameState: GameState;
  isAnimating: boolean;
  playingCard: ICard | null;
  activeAttackerId: string | null;
  pendingEntityReplacement: { cardId: string; mode: BattleMode } | null;
  pendingFusionSummon: { cardId: string; mode: "ATTACK" | "DEFENSE"; materials: string[] } | null;
  assertPlayerTurn: () => boolean;
  applyTransition: (transition: (state: GameState) => GameState) => GameState | null;
  clearSelection: () => void;
  clearError: () => void;
  resolvePendingTurnAction: (selectedId: string) => void;
  setSelectedCard: (card: ICard | null) => void;
  setPlayingCard: (card: ICard | null) => void;
  setActiveAttackerId: (value: string | null | ((prev: string | null) => string | null)) => void;
  setIsAnimating: (value: boolean) => void;
  setRevealedEntities: (value: string[] | ((prev: string[]) => string[])) => void;
  setPendingEntityReplacement: (value: { cardId: string; mode: BattleMode } | null) => void;
  setPendingFusionSummon: (value: { cardId: string; mode: "ATTACK" | "DEFENSE"; materials: string[] } | null) => void;
  setLastError: (value: IBoardUiError | null) => void;
}

interface IPlayerActions {
  toggleCardSelection: (card: ICard, event?: React.MouseEvent) => void;
  executePlayAction: (mode: BattleMode, event: React.MouseEvent) => Promise<void>;
  handleEntityClick: (entity: IBoardEntity | null, isOpponent: boolean, event: React.MouseEvent) => Promise<void>;
}

const PLAYER_TRAP_PREVIEW_MS = 700;
const PLAYER_POST_RESOLUTION_MS = 650;

export function usePlayerActions({
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
}: IUsePlayerActionsParams): IPlayerActions {
  const toggleCardSelection = useCallback(
    (card: ICard, event?: React.MouseEvent) => {
      event?.stopPropagation();
      if (isAnimating || !assertPlayerTurn()) return;
      if (gameState.pendingTurnAction?.playerId === gameState.playerA.id) {
        setLastError({ code: "GAME_RULE_ERROR", message: "Debes resolver la acción obligatoria antes de jugar." });
        return;
      }
      if (playingCard?.id === card.id) {
        clearSelection();
      } else {
        setSelectedCard(card);
        setPlayingCard(card);
        setActiveAttackerId(null);
      }
      clearError();
    },
    [
      assertPlayerTurn,
      clearError,
      clearSelection,
      gameState.pendingTurnAction,
      gameState.playerA.id,
      isAnimating,
      playingCard?.id,
      setActiveAttackerId,
      setLastError,
      setPlayingCard,
      setSelectedCard,
    ],
  );

  const executePlayAction = useCallback(
    async (mode: BattleMode, event: React.MouseEvent) => {
      event.stopPropagation();
      if (!playingCard || isAnimating || !assertPlayerTurn()) return;
      if (gameState.pendingTurnAction?.playerId === gameState.playerA.id) {
        setLastError({ code: "GAME_RULE_ERROR", message: "Debes resolver la acción obligatoria antes de jugar." });
        return;
      }

      clearError();
      if (
        playingCard.type === "ENTITY" &&
        (mode === "ATTACK" || mode === "DEFENSE") &&
        gameState.playerA.activeEntities.length >= 3
      ) {
        setPendingEntityReplacement({ cardId: playingCard.id, mode });
        setLastError(null);
        return;
      }

      if (playingCard.type === "FUSION" && (mode === "ATTACK" || mode === "DEFENSE")) {
        if (gameState.playerA.activeEntities.length < 2) {
          setLastError({ code: "GAME_RULE_ERROR", message: "Necesitas 2 entidades en campo para fusionar." });
          return;
        }
        setPendingFusionSummon({ cardId: playingCard.id, mode, materials: [] });
        return;
      }

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
        const reactiveTrap = findReactiveTrap(gameState, gameState.playerB.id, "ON_OPPONENT_EXECUTION_ACTIVATED");
        if (reactiveTrap) {
          setRevealedEntities((previous) => addRevealedId(previous, reactiveTrap.instanceId));
          setActiveAttackerId(reactiveTrap.instanceId);
          await sleep(PLAYER_TRAP_PREVIEW_MS);
        }
        applyTransition((state) => GameEngine.resolveExecution(state, state.playerA.id, executionId));
        if (reactiveTrap) {
          await sleep(PLAYER_POST_RESOLUTION_MS);
          setRevealedEntities((previous) => removeRevealedId(previous, reactiveTrap.instanceId));
        }
        setActiveAttackerId(null);
        setIsAnimating(false);
        return;
      }

      const played = applyTransition((state) => GameEngine.playCard(state, state.playerA.id, playingCard.id, mode));
      if (played) clearSelection();
    },
    [
      applyTransition,
      assertPlayerTurn,
      clearError,
      clearSelection,
      gameState,
      isAnimating,
      playingCard,
      setActiveAttackerId,
      setPendingEntityReplacement,
      setPendingFusionSummon,
      setIsAnimating,
      setLastError,
      setRevealedEntities,
    ],
  );

  const handleEntityClick = useCallback(
    async (entity: IBoardEntity | null, isOpponent: boolean, event: React.MouseEvent) => {
      event.stopPropagation();
      if (isAnimating || !assertPlayerTurn()) return;
      if (gameState.pendingTurnAction?.playerId === gameState.playerA.id) {
        if (!isOpponent && entity) {
          resolvePendingTurnAction(entity.instanceId);
          return;
        }

        setLastError({ code: "GAME_RULE_ERROR", message: "Debes resolver la acción obligatoria antes de jugar." });
        return;
      }

      if (pendingEntityReplacement) {
        if (!isOpponent && entity) {
          const replacedState = applyTransition((state) =>
            GameEngine.playCardWithEntityReplacement(
              state,
              state.playerA.id,
              pendingEntityReplacement.cardId,
              pendingEntityReplacement.mode,
              entity.instanceId,
            ),
          );
          if (replacedState) {
            setPendingEntityReplacement(null);
            clearSelection();
          }
          return;
        }

        setLastError({ code: "GAME_RULE_ERROR", message: "Selecciona una entidad de tu campo para reemplazar." });
        return;
      }

      if (pendingFusionSummon) {
        if (isOpponent || !entity) {
          setLastError({ code: "GAME_RULE_ERROR", message: "Selecciona materiales de tu campo para fusionar." });
          return;
        }

        if (pendingFusionSummon.materials.includes(entity.instanceId)) {
          setPendingFusionSummon({
            ...pendingFusionSummon,
            materials: pendingFusionSummon.materials.filter((id) => id !== entity.instanceId),
          });
          return;
        }

        const nextMaterials = [...pendingFusionSummon.materials, entity.instanceId].slice(0, 2);
        if (nextMaterials.length < 2) {
          setPendingFusionSummon({ ...pendingFusionSummon, materials: nextMaterials });
          return;
        }

        const fusedState = applyTransition((state) =>
          GameEngine.fuseCards(
            state,
            state.playerA.id,
            pendingFusionSummon.cardId,
            [nextMaterials[0], nextMaterials[1]],
            pendingFusionSummon.mode,
          ),
        );

        if (fusedState) {
          setPendingFusionSummon(null);
          clearSelection();
        }
        return;
      }

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
          const reactiveTrap = findReactiveTrap(gameState, gameState.playerB.id, "ON_OPPONENT_EXECUTION_ACTIVATED");
          if (reactiveTrap) {
            setRevealedEntities((previous) => addRevealedId(previous, reactiveTrap.instanceId));
            setActiveAttackerId(reactiveTrap.instanceId);
            await sleep(PLAYER_TRAP_PREVIEW_MS);
          }
          applyTransition((state) => GameEngine.resolveExecution(state, state.playerA.id, entity.instanceId));
          if (reactiveTrap) {
            await sleep(PLAYER_POST_RESOLUTION_MS);
            setRevealedEntities((previous) => removeRevealedId(previous, reactiveTrap.instanceId));
          }
          setActiveAttackerId(null);
          setIsAnimating(false);
          return;
        }

        if (gameState.phase !== "BATTLE") {
          setSelectedCard(entity.card);
          return;
        }

        if (entity.mode !== "ATTACK" || entity.hasAttackedThisTurn) return;
        if (activeAttackerId === entity.instanceId) {
          const changedState = applyTransition((state) => GameEngine.changeEntityMode(state, state.playerA.id, entity.instanceId, "DEFENSE"));
          if (changedState) {
            setActiveAttackerId(null);
            setSelectedCard(entity.card);
          }
          return;
        }
        setActiveAttackerId((previous) => (previous === entity.instanceId ? null : entity.instanceId));
        setSelectedCard(entity.card);
        setPlayingCard(null);
        return;
      }

      if (activeAttackerId) {
        setIsAnimating(true);
        const attackerId = activeAttackerId;
        const targetId = entity?.instanceId;
        clearSelection();

        if (entity && (entity.mode === "DEFENSE" || entity.mode === "SET") && targetId) {
          setRevealedEntities((previous) => addRevealedId(previous, targetId));
          await sleep(800);
        }

        const reactiveTrap = findReactiveTrap(gameState, gameState.playerB.id, "ON_OPPONENT_ATTACK_DECLARED");
        if (reactiveTrap) {
          setRevealedEntities((previous) => addRevealedId(previous, reactiveTrap.instanceId));
          setActiveAttackerId(reactiveTrap.instanceId);
          await sleep(PLAYER_TRAP_PREVIEW_MS);
          setActiveAttackerId(attackerId);
        }

        applyTransition((state) => GameEngine.executeAttack(state, state.playerA.id, attackerId, targetId));
        if (targetId) {
          setRevealedEntities((previous) => removeRevealedId(previous, targetId));
        }
        if (reactiveTrap) {
          await sleep(PLAYER_POST_RESOLUTION_MS);
          setRevealedEntities((previous) => removeRevealedId(previous, reactiveTrap.instanceId));
        }
        setActiveAttackerId(null);
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
      pendingEntityReplacement,
      pendingFusionSummon,
      gameState,
      isAnimating,
      resolvePendingTurnAction,
      setActiveAttackerId,
      setIsAnimating,
      setPendingEntityReplacement,
      setPendingFusionSummon,
      setPlayingCard,
      setRevealedEntities,
      setSelectedCard,
      setLastError,
    ],
  );

  return { toggleCardSelection, executePlayAction, handleEntityClick };
}
