// src/components/game/board/hooks/internal/player-actions/useExecutePlayAction.ts - Ejecuta jugadas de mano del jugador respetando estados, modo y reacciones.
import { useCallback } from "react";
import { BattleMode } from "@/core/entities/IPlayer";
import { GameEngine } from "@/core/use-cases/GameEngine";
import { sleep } from "../sleep";
import { addRevealedId, findReactiveTrap, removeRevealedId } from "../trapPreview";
import { PLAYER_POST_RESOLUTION_MS, PLAYER_TRAP_PREVIEW_MS } from "./constants";
import { IUsePlayerActionsParams } from "./types";

type IExecutePlayActionParams = Pick<
  IUsePlayerActionsParams,
  | "applyTransition"
  | "assertPlayerTurn"
  | "clearError"
  | "clearSelection"
  | "gameState"
  | "isAnimating"
  | "playingCard"
  | "setActiveAttackerId"
  | "setPendingEntityReplacement"
  | "setPendingEntityReplacementTargetId"
  | "setIsAnimating"
  | "setLastError"
  | "setSelectedCard"
  | "setSelectedBoardEntityInstanceId"
  | "setRevealedEntities"
>;

export function useExecutePlayAction({
  applyTransition,
  assertPlayerTurn,
  clearError,
  clearSelection,
  gameState,
  isAnimating,
  playingCard,
  setActiveAttackerId,
  setPendingEntityReplacement,
  setPendingEntityReplacementTargetId,
  setIsAnimating,
  setLastError,
  setSelectedCard,
  setSelectedBoardEntityInstanceId,
  setRevealedEntities,
}: IExecutePlayActionParams) {
  function resolvePlayErrorMessage(error: unknown): string {
    return error instanceof Error && error.message.trim().length > 0 ? error.message : "No se pudo jugar la carta.";
  }

  return useCallback(
    async (mode: BattleMode, event: React.MouseEvent) => {
      event.stopPropagation();
      if (!playingCard || isAnimating || !assertPlayerTurn()) return;

      if (gameState.pendingTurnAction?.playerId === gameState.playerA.id) {
        setLastError({ code: "GAME_RULE_ERROR", message: "Debes resolver la acción obligatoria antes de jugar." });
        return;
      }

      clearError();
      setSelectedBoardEntityInstanceId(null);
      const selectedCardReference = playingCard.runtimeId ?? playingCard.id;
      if (playingCard.type === "ENTITY" && (mode === "ATTACK" || mode === "DEFENSE") && gameState.playerA.activeEntities.length >= 3) {
        try {
          GameEngine.playCard(gameState, gameState.playerA.id, selectedCardReference, mode);
        } catch (error: unknown) {
          const message = resolvePlayErrorMessage(error);
          if (!message.includes("zona de entidades está llena")) {
            setLastError({ code: "GAME_RULE_ERROR", message });
            return;
          }
        }
        setPendingEntityReplacement({ cardId: selectedCardReference, mode, zone: "ENTITIES" });
        setPendingEntityReplacementTargetId(null);
        setLastError(null);
        return;
      }

      if ((playingCard.type === "EXECUTION" || playingCard.type === "TRAP") && gameState.playerA.activeExecutions.length >= 3) {
        try {
          GameEngine.playCard(gameState, gameState.playerA.id, selectedCardReference, mode);
        } catch (error: unknown) {
          const message = resolvePlayErrorMessage(error);
          if (!message.includes("zona de ejecuciones está llena")) {
            setLastError({ code: "GAME_RULE_ERROR", message });
            return;
          }
        }
        setPendingEntityReplacement({ cardId: selectedCardReference, mode, zone: "EXECUTIONS" });
        setPendingEntityReplacementTargetId(null);
        setLastError(null);
        return;
      }

      if (playingCard.type === "FUSION" && (mode === "ATTACK" || mode === "DEFENSE")) {
        applyTransition((state) => GameEngine.startFusionSummon(state, state.playerA.id, selectedCardReference, mode));
        return;
      }

      if (mode === "ACTIVATE") {
        setIsAnimating(true);
        const playedState = applyTransition((state) => GameEngine.playCard(state, state.playerA.id, selectedCardReference, mode));
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
        const playerCounterTrap = reactiveTrap
          ? findReactiveTrap(gameState, gameState.playerA.id, "ON_OPPONENT_TRAP_ACTIVATED")
          : null;
        if (reactiveTrap) {
          setRevealedEntities((previous) => addRevealedId(previous, reactiveTrap.instanceId));
          setActiveAttackerId(reactiveTrap.instanceId);
          setSelectedCard(reactiveTrap.card);
          await sleep(PLAYER_TRAP_PREVIEW_MS);
        }
        if (playerCounterTrap) {
          setRevealedEntities((previous) => addRevealedId(previous, playerCounterTrap.instanceId));
          setActiveAttackerId(playerCounterTrap.instanceId);
          setSelectedCard(playerCounterTrap.card);
          await sleep(PLAYER_TRAP_PREVIEW_MS);
        }
        applyTransition((state) => GameEngine.resolveExecution(state, state.playerA.id, executionId));
        if (reactiveTrap) {
          await sleep(PLAYER_POST_RESOLUTION_MS);
          setRevealedEntities((previous) => removeRevealedId(previous, reactiveTrap.instanceId));
        }
        if (playerCounterTrap) {
          await sleep(PLAYER_POST_RESOLUTION_MS);
          setRevealedEntities((previous) => removeRevealedId(previous, playerCounterTrap.instanceId));
        }
        setSelectedCard(null);
        setActiveAttackerId(null);
        setIsAnimating(false);
        return;
      }

      const played = applyTransition((state) => GameEngine.playCard(state, state.playerA.id, selectedCardReference, mode));
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
      setPendingEntityReplacementTargetId,
      setIsAnimating,
      setLastError,
      setSelectedCard,
      setSelectedBoardEntityInstanceId,
      setRevealedEntities,
    ],
  );
}
