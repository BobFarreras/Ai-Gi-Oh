// src/core/services/opponent/heuristic-fusion-materials.ts - Selección de materiales válidos para jugadas de fusión del bot.
import { ICard } from "@/core/entities/ICard";
import { IPlayer } from "@/core/entities/IPlayer";
import { getFusionRecipe } from "@/core/use-cases/game-engine/fusion/fusion-recipes";

export function chooseFusionMaterials(opponent: IPlayer, fusionCard: ICard): [string, string] | null {
  const recipe = getFusionRecipe(fusionCard);
  if (!recipe || opponent.activeEntities.length < 2) return null;
  const pairs: [typeof opponent.activeEntities[number], typeof opponent.activeEntities[number]][] = [];
  for (let i = 0; i < opponent.activeEntities.length; i += 1) {
    for (let j = i + 1; j < opponent.activeEntities.length; j += 1) {
      pairs.push([opponent.activeEntities[i], opponent.activeEntities[j]]);
    }
  }
  const validPair = pairs.find(([a, b]) => {
    const materials = [a, b];
    if (recipe.requiredArchetypes) {
      const pending = [...recipe.requiredArchetypes];
      for (const material of materials) {
        const archetype = material.card.archetype;
        if (!archetype) continue;
        const index = pending.indexOf(archetype);
        if (index >= 0) pending.splice(index, 1);
      }
      if (pending.length > 0) return false;
    }
    const requiredEnergyPerMaterial = recipe.requiredEnergyPerMaterial;
    if (
      requiredEnergyPerMaterial !== undefined &&
      materials.some((material) => material.card.cost < requiredEnergyPerMaterial)
    ) {
      return false;
    }
    if (recipe.requiredTotalEnergy) {
      const totalCost = materials[0].card.cost + materials[1].card.cost;
      if (totalCost < recipe.requiredTotalEnergy) return false;
    }
    return true;
  });
  return validPair ? [validPair[0].instanceId, validPair[1].instanceId] : null;
}
