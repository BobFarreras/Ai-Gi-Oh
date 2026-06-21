// src/components/game/board/hooks/internal/player-actions/useHandleEntityClick.ts - Orquesta clics sobre entidades propias/rivales y delega flujos según contexto de acción.
import { useCallback } from "react";
import { useLocalActionEmitter } from "@/components/game/board/multiplayer/local-action-emitter";
import { IUsePlayerActionsParams } from "./types";
import { handleOwnEntityClick } from "./handleOwnEntityClick";
import { handleOpponentEntityClick } from "./handleOpponentEntityClick";
import { sleep } from "../sleep";
import { addRevealedId, removeRevealedId } from "../trapPreview";

// Tiempo que la carta seteada revelada permanece boca arriba para que el jugador la vea.
const OPPONENT_SET_REVEAL_MS = 2200;

type IHandleEntityClickParams = Pick<
  IUsePlayerActionsParams,
  | "activeAttackerId"
  | "applyTransition"
  | "assertPlayerTurn"
  | "clearError"
  | "clearSelection"
  | "gameState"
  | "isAnimating"
  | "pendingEntityReplacement"
  | "pendingEntityReplacementTargetId"
  | "pendingFusionSummon"
  | "resolvePendingTurnAction"
  | "setActiveAttackerId"
  | "setIsAnimating"
  | "setLastError"
  | "setPendingEntityReplacement"
  | "setPendingEntityReplacementTargetId"
  | "setPendingFusionSummon"
  | "setPlayingCard"
  | "setRevealedEntities"
  | "setSelectedCard"
  | "setSelectedBoardEntityInstanceId"
>;

export function useHandleEntityClick(params: IHandleEntityClickParams) {
  const emitLocalAction = useLocalActionEmitter();
  return useCallback(
    async (entity: IUsePlayerActionsParams["gameState"]["playerA"]["activeEntities"][number] | null, isOpponent: boolean, event: React.MouseEvent) => {
      event.stopPropagation();
      if (params.isAnimating || !params.assertPlayerTurn()) return;

      if (params.gameState.pendingTurnAction?.playerId === params.gameState.playerA.id) {
        const pending = params.gameState.pendingTurnAction;
        // Revelar carta seteada del rival: a diferencia del resto de acciones obligatorias,
        // esta se resuelve clicando una carta boca abajo del RIVAL, no una propia.
        if (pending.type === "SELECT_OPPONENT_SET_CARD") {
          if (isOpponent && entity && entity.mode === "SET") {
            params.setIsAnimating(true);
            params.setRevealedEntities((previous) => addRevealedId(previous, entity.instanceId));
            params.setSelectedCard(entity.card);
            params.resolvePendingTurnAction(entity.instanceId);
            await sleep(OPPONENT_SET_REVEAL_MS);
            params.setRevealedEntities((previous) => removeRevealedId(previous, entity.instanceId));
            params.setSelectedCard(null);
            params.setIsAnimating(false);
            return;
          }
          params.setLastError({ code: "GAME_RULE_ERROR", message: "Selecciona una carta boca abajo (seteada) del rival para revelarla." });
          return;
        }
        if (!isOpponent && entity) {
          params.resolvePendingTurnAction(entity.instanceId);
          return;
        }
        params.setLastError({ code: "GAME_RULE_ERROR", message: "Debes resolver la acción obligatoria antes de jugar." });
        return;
      }

      params.clearError();
      if (params.pendingEntityReplacement && isOpponent) {
        params.setLastError({ code: "GAME_RULE_ERROR", message: "Selecciona una entidad de tu campo para reemplazarla." });
        return;
      }

      if (!isOpponent) {
        const result = await handleOwnEntityClick({
          entity,
          event,
          activeAttackerId: params.activeAttackerId,
          applyTransition: params.applyTransition,
          clearSelection: params.clearSelection,
          gameState: params.gameState,
          pendingFusionSummon: params.pendingFusionSummon,
          pendingEntityReplacement: params.pendingEntityReplacement,
          pendingEntityReplacementTargetId: params.pendingEntityReplacementTargetId,
          setActiveAttackerId: params.setActiveAttackerId,
          setLastError: params.setLastError,
          setPendingEntityReplacementTargetId: params.setPendingEntityReplacementTargetId,
          setPendingFusionSummon: params.setPendingFusionSummon,
          setPlayingCard: params.setPlayingCard,
          setSelectedCard: params.setSelectedCard,
          setSelectedBoardEntityInstanceId: params.setSelectedBoardEntityInstanceId,
        });
        if (result === "handled") return;
      }

      const result = await handleOpponentEntityClick({
        entity,
        activeAttackerId: params.activeAttackerId,
        applyTransition: params.applyTransition,
        clearSelection: params.clearSelection,
        gameState: params.gameState,
        setActiveAttackerId: params.setActiveAttackerId,
        setIsAnimating: params.setIsAnimating,
        setRevealedEntities: params.setRevealedEntities,
        setSelectedCard: params.setSelectedCard,
        emitLocalAction,
      });
      if (result === "handled") return;

      if (entity) {
        params.setSelectedCard(entity.card);
        params.setSelectedBoardEntityInstanceId(null);
      }
    },
    [params, emitLocalAction],
  );
}
