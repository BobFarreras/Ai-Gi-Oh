// src/core/use-cases/game-engine/fusion/internal/validate-materials-against-recipe.ts - Valida que los materiales cumplan IDs/arquetipos requeridos por una receta.
import { IBoardEntity } from "@/core/entities/IPlayer";
import { ValidationError } from "@/core/errors/ValidationError";
import { IFusionRecipe } from "@/core/use-cases/game-engine/fusion/fusion-recipes";

/**
 * Verifica que el conjunto de materiales cumpla la receta configurada para la fusión.
 */
export function validateMaterialsAgainstRecipe(recipe: IFusionRecipe, materials: readonly IBoardEntity[]): void {
  if (recipe.requiredMaterialIds) {
    const cardIds = materials.map((material) => material.card.id);
    const matches = recipe.requiredMaterialIds.every((requiredId) => cardIds.includes(requiredId));
    if (!matches) throw new ValidationError("Los materiales no cumplen la receta de fusión.");
  }
  if (recipe.requiredArchetypes) {
    const pending = [...recipe.requiredArchetypes];
    for (const material of materials) {
      const archetype = material.card.archetype;
      if (!archetype) continue;
      const index = pending.indexOf(archetype);
      if (index >= 0) pending.splice(index, 1);
    }
    if (pending.length > 0) throw new ValidationError("Los arquetipos de los materiales no cumplen la receta.");
  }
}
