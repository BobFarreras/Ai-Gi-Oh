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
  setRevealedEntities,
}: IExecutePlayActionParams) {
  return useCallback(
    async (mode: BattleMode, event: React.MouseEvent) => {
      event.stopPropagation();
      if (!playingCard || isAnimating || !assertPlayerTurn()) return;

      if (gameState.pendingTurnAction?.playerId === gameState.playerA.id) {
        setLastError({ code: "GAME_RULE_ERROR", message: "Debes resolver la acción obligatoria antes de jugar." });
        return;
      }

      clearError();
      const selectedCardReference = playingCard.runtimeId ?? playingCard.id;
      if (playingCard.type === "ENTITY" && (mode === "ATTACK" || mode === "DEFENSE") && gameState.playerA.activeEntities.length >= 3) {
        setPendingEntityReplacement({ cardId: selectedCardReference, mode });
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
      setRevealedEntities,
    ],
  );
}
