// src/core/use-cases/game-engine/state/pending-turn-action-factory.ts - Fábrica central de acciones pendientes para mantener construcción consistente de estado.
import { CardType } from "@/core/entities/ICard";
import {
  IDiscardForHandLimitPendingTurnAction,
  ISelectFusionMaterialsPendingTurnAction,
  ISelectGraveyardCardPendingTurnAction,
} from "@/core/use-cases/game-engine/state/types";

/**
 * Construye la acción pendiente de descarte al inicio de turno con mano en límite.
 */
export function createDiscardForHandLimitPendingAction(playerId: string): IDiscardForHandLimitPendingTurnAction {
  return { type: "DISCARD_FOR_HAND_LIMIT", playerId };
}

interface ICreateFusionMaterialsPendingActionParams {
  playerId: string;
  mode: "ATTACK" | "DEFENSE";
  fusionCardId?: string;
  fusionFromExecutionInstanceId?: string;
  fusionFromExecutionRecipeId?: string;
  selectedMaterialInstanceIds?: string[];
}

/**
 * Construye una acción de selección de materiales de fusión reutilizable para mano o ejecución.
 */
export function createFusionMaterialsPendingAction(
  params: ICreateFusionMaterialsPendingActionParams,
): ISelectFusionMaterialsPendingTurnAction {
  return {
    type: "SELECT_FUSION_MATERIALS",
    playerId: params.playerId,
    fusionCardId: params.fusionCardId,
    fusionFromExecutionInstanceId: params.fusionFromExecutionInstanceId,
    fusionFromExecutionRecipeId: params.fusionFromExecutionRecipeId,
    mode: params.mode,
    selectedMaterialInstanceIds: params.selectedMaterialInstanceIds ?? [],
  };
}

/**
 * Construye la acción pendiente para seleccionar carta de cementerio.
 */
export function createGraveyardSelectionPendingAction(
  playerId: string,
  executionInstanceId: string,
  destination: "HAND" | "FIELD",
  cardType?: CardType,
): ISelectGraveyardCardPendingTurnAction {
  return {
    type: "SELECT_GRAVEYARD_CARD",
    playerId,
    executionInstanceId,
    destination,
    cardType,
  };
}
