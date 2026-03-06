// src/components/game/board/hooks/internal/player-actions/useHandleEntityClick.ts - Orquesta clics sobre entidades propias/rivales y delega flujos según contexto de acción.
import { useCallback } from "react";
import { IUsePlayerActionsParams } from "./types";
import { handleOwnEntityClick } from "./handleOwnEntityClick";
import { handleOpponentEntityClick } from "./handleOpponentEntityClick";

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
>;

export function useHandleEntityClick(params: IHandleEntityClickParams) {
  return useCallback(
    async (entity: IUsePlayerActionsParams["gameState"]["playerA"]["activeEntities"][number] | null, isOpponent: boolean, event: React.MouseEvent) => {
      event.stopPropagation();
      if (params.isAnimating || !params.assertPlayerTurn()) return;

      if (params.gameState.pendingTurnAction?.playerId === params.gameState.playerA.id) {
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
          activeAttackerId: params.activeAttackerId,
          applyTransition: params.applyTransition,
          clearSelection: params.clearSelection,
          gameState: params.gameState,
          pendingFusionSummon: params.pendingFusionSummon,
          pendingEntityReplacement: params.pendingEntityReplacement,
          pendingEntityReplacementTargetId: params.pendingEntityReplacementTargetId,
          setActiveAttackerId: params.setActiveAttackerId,
          setIsAnimating: params.setIsAnimating,
          setLastError: params.setLastError,
          setPendingEntityReplacementTargetId: params.setPendingEntityReplacementTargetId,
          setPendingFusionSummon: params.setPendingFusionSummon,
          setPlayingCard: params.setPlayingCard,
          setRevealedEntities: params.setRevealedEntities,
          setSelectedCard: params.setSelectedCard,
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
      });
      if (result === "handled") return;

      if (entity) params.setSelectedCard(entity.card);
    },
    [params],
  );
}
