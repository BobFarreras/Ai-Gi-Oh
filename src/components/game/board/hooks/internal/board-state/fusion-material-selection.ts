// src/components/game/board/hooks/internal/board-state/fusion-material-selection.ts - Calcula materiales seleccionables de fusión para resaltar solo candidatos válidos.
import { resolveSelectableMaterialInstanceIds } from "@/core/use-cases/game-engine/fusion/internal/selectable-material-instance-ids";
import { GameState } from "@/core/use-cases/GameEngine";

/**
 * Devuelve instancias del campo propio que pueden participar en la receta activa.
 * Incluye entidades en ATTACK, DEFENSE y SET.
 */
export function resolveSelectableFusionMaterialIds(gameState: GameState): string[] {
  const pendingAction = gameState.pendingTurnAction;
  if (!pendingAction || pendingAction.type !== "SELECT_FUSION_MATERIALS" || pendingAction.playerId !== gameState.playerA.id) {
    return [];
  }

  const playerEntities = gameState.playerA.activeEntities;
  const recipeId = pendingAction.fusionFromExecutionRecipeId ?? pendingAction.fusionCardId ?? null;
  if (!recipeId) {
    return playerEntities.map((entity) => entity.instanceId);
  }

  return resolveSelectableMaterialInstanceIds(playerEntities, recipeId);
}
