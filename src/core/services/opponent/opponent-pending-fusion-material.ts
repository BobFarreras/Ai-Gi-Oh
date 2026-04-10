// src/core/services/opponent/opponent-pending-fusion-material.ts - Selecciona material de fusión válido cuando el rival resuelve acciones pendientes.
import { IBoardEntity } from "@/core/entities/IPlayer";
import { chooseFusionMaterialsByRecipeId } from "@/core/services/opponent/heuristic-fusion-materials";

function pickFirstNonSelected(activeEntities: IBoardEntity[], selectedMaterialInstanceIds: string[]): string | null {
  return activeEntities.find((entity) => !selectedMaterialInstanceIds.includes(entity.instanceId))?.instanceId ?? null;
}

/**
 * Prioriza seleccionar materiales válidos para la receta pendiente y evita picks aleatorios inválidos.
 */
export function pickPendingFusionMaterialInstanceId(input: {
  activeEntities: IBoardEntity[];
  selectedMaterialInstanceIds: string[];
  recipeId?: string;
}): string | null {
  if (!input.recipeId) return pickFirstNonSelected(input.activeEntities, input.selectedMaterialInstanceIds);
  const pair = chooseFusionMaterialsByRecipeId(input.activeEntities, input.recipeId);
  if (!pair) return pickFirstNonSelected(input.activeEntities, input.selectedMaterialInstanceIds);
  return pair.find((instanceId) => !input.selectedMaterialInstanceIds.includes(instanceId)) ?? null;
}
