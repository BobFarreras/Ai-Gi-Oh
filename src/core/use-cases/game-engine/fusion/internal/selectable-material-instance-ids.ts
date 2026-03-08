// src/core/use-cases/game-engine/fusion/internal/selectable-material-instance-ids.ts - Resuelve instancias elegibles de materiales para una receta de fusión.
import { IBoardEntity } from "@/core/entities/IPlayer";
import { getFusionRecipeByResultId } from "@/core/use-cases/game-engine/fusion/fusion-recipes";

export function resolveSelectableMaterialInstanceIds(
  playerEntities: IBoardEntity[],
  fusionResultCardId: string,
): string[] {
  const recipe = getFusionRecipeByResultId(fusionResultCardId);
  if (!recipe) return playerEntities.map((entity) => entity.instanceId);

  if (recipe.requiredMaterialIds && recipe.requiredMaterialIds.length > 0) {
    return playerEntities
      .filter((entity) => recipe.requiredMaterialIds!.includes(entity.card.id))
      .map((entity) => entity.instanceId);
  }

  if (recipe.requiredArchetypes && recipe.requiredArchetypes.length > 0) {
    return playerEntities
      .filter((entity) => Boolean(entity.card.archetype) && recipe.requiredArchetypes!.includes(entity.card.archetype!))
      .map((entity) => entity.instanceId);
  }

  return playerEntities.map((entity) => entity.instanceId);
}

