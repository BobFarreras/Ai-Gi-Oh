// src/components/game/board/hooks/internal/player-actions/useExecutePlayAction.ts - Ejecuta jugadas de mano del jugador respetando estados, modo y reacciones.
import { useCallback } from "react";
import { BattleMode } from "@/core/entities/IPlayer";
import { GameEngine } from "@/core/use-cases/GameEngine";
import { IUsePlayerActionsParams } from "./types";
import { attemptZoneReplacementOnFull, executeActivationPlay } from "./useExecutePlayAction.internal";

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
        attemptZoneReplacementOnFull({
          gameState,
          selectedCardReference,
          mode,
          zone: "ENTITIES",
          fullZoneMessage: "zona de entidades está llena",
          setPendingEntityReplacement,
          setPendingEntityReplacementTargetId,
          setLastError,
        });
        return;
      }

      if ((playingCard.type === "EXECUTION" || playingCard.type === "TRAP") && gameState.playerA.activeExecutions.length >= 3) {
        attemptZoneReplacementOnFull({
          gameState,
          selectedCardReference,
          mode,
          zone: "EXECUTIONS",
          fullZoneMessage: "zona de ejecuciones está llena",
          setPendingEntityReplacement,
          setPendingEntityReplacementTargetId,
          setLastError,
        });
        return;
      }

      if (playingCard.type === "FUSION" && (mode === "ATTACK" || mode === "DEFENSE")) {
        applyTransition((state) => GameEngine.startFusionSummon(state, state.playerA.id, selectedCardReference, mode));
        return;
      }

      if (mode === "ACTIVATE") {
        await executeActivationPlay({
          gameState,
          selectedCardReference,
          applyTransition,
          clearSelection,
          setIsAnimating,
          setLastError,
          setRevealedEntities,
          setActiveAttackerId,
          setSelectedCard,
        });
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
