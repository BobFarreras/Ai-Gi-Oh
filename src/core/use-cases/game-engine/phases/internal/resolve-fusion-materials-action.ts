// src/core/use-cases/game-engine/phases/internal/resolve-fusion-materials-action.ts - Resuelve selección/toggle de materiales de fusión y dispara la fusión al completar 2.
import { IPlayer } from "@/core/entities/IPlayer";
import { GameRuleError } from "@/core/errors/GameRuleError";
import { NotFoundError } from "@/core/errors/NotFoundError";
import { fuseCards } from "@/core/use-cases/game-engine/fusion/fuse-cards";
import { fuseCardsFromExecution } from "@/core/use-cases/game-engine/fusion/fuse-cards-from-execution";
import { createFusionMaterialsPendingAction } from "@/core/use-cases/game-engine/state/pending-turn-action-factory";
import { ISelectFusionMaterialsPendingTurnAction, GameState } from "@/core/use-cases/game-engine/state/types";

function resolveSelectedMaterialIds(
  pending: ISelectFusionMaterialsPendingTurnAction,
  selectedId: string,
): string[] {
  const wasSelected = pending.selectedMaterialInstanceIds.includes(selectedId);
  return wasSelected
    ? pending.selectedMaterialInstanceIds.filter((id) => id !== selectedId)
    : [...pending.selectedMaterialInstanceIds, selectedId].slice(0, 2);
}

/**
 * Gestiona una selección de material y, si ya hay dos, ejecuta la fusión correspondiente.
 */
export function resolveFusionMaterialsAction(
  state: GameState,
  playerId: string,
  selectedId: string,
  player: IPlayer,
  pending: ISelectFusionMaterialsPendingTurnAction,
): GameState {
  const entityExists = player.activeEntities.some((entity) => entity.instanceId === selectedId);
  if (!entityExists) {
    throw new NotFoundError("La entidad seleccionada no existe en tu campo.");
  }

  const selectedMaterialInstanceIds = resolveSelectedMaterialIds(pending, selectedId);
  if (selectedMaterialInstanceIds.length < 2) {
    return {
      ...state,
      pendingTurnAction: createFusionMaterialsPendingAction({
        playerId,
        mode: pending.mode,
        fusionCardId: pending.fusionCardId,
        fusionFromExecutionInstanceId: pending.fusionFromExecutionInstanceId,
        fusionFromExecutionRecipeId: pending.fusionFromExecutionRecipeId,
        selectedMaterialInstanceIds,
      }),
    };
  }

  const withoutPending: GameState = {
    ...state,
    pendingTurnAction: null,
  };
  const materials: [string, string] = [selectedMaterialInstanceIds[0], selectedMaterialInstanceIds[1]];
  if (pending.fusionFromExecutionInstanceId && pending.fusionFromExecutionRecipeId) {
    return fuseCardsFromExecution(
      withoutPending,
      playerId,
      pending.fusionFromExecutionInstanceId,
      pending.fusionFromExecutionRecipeId,
      materials,
    );
  }
  if (!pending.fusionCardId) {
    throw new GameRuleError("No se encontró carta de fusión asociada a la acción pendiente.");
  }
  return fuseCards(withoutPending, playerId, pending.fusionCardId, materials, pending.mode);
}
