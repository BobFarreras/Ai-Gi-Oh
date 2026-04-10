// src/core/services/opponent/heuristic-fusion-materials.ts - Selección de materiales válidos para jugadas de fusión del bot.
import { ICard } from "@/core/entities/ICard";
import { IBoardEntity, IPlayer } from "@/core/entities/IPlayer";
import { getFusionRecipe, getFusionRecipeByResultId, IFusionRecipe } from "@/core/use-cases/game-engine/fusion/fusion-recipes";

function buildMaterialPairs(activeEntities: IBoardEntity[]): [IBoardEntity, IBoardEntity][] {
  const pairs: [IBoardEntity, IBoardEntity][] = [];
  for (let i = 0; i < activeEntities.length; i += 1) {
    for (let j = i + 1; j < activeEntities.length; j += 1) {
      pairs.push([activeEntities[i], activeEntities[j]]);
    }
  }
  return pairs;
}

function matchesRecipeByMaterialIds(materials: [IBoardEntity, IBoardEntity], recipe: IFusionRecipe): boolean {
  if (!recipe.requiredMaterialIds || recipe.requiredMaterialIds.length === 0) return true;
  const materialIds = materials.map((entity) => entity.card.id);
  return recipe.requiredMaterialIds.every((requiredId) => materialIds.includes(requiredId));
}

function matchesRecipeByArchetype(materials: [IBoardEntity, IBoardEntity], recipe: IFusionRecipe): boolean {
  if (!recipe.requiredArchetypes || recipe.requiredArchetypes.length === 0) return true;
  const pendingArchetypes = [...recipe.requiredArchetypes];
  for (const material of materials) {
    const archetype = material.card.archetype;
    if (!archetype) continue;
    const index = pendingArchetypes.indexOf(archetype);
    if (index >= 0) pendingArchetypes.splice(index, 1);
  }
  return pendingArchetypes.length === 0;
}

function matchesRecipeByEnergy(materials: [IBoardEntity, IBoardEntity], recipe: IFusionRecipe): boolean {
  const requiredEnergyPerMaterial = recipe.requiredEnergyPerMaterial ?? null;
  if (requiredEnergyPerMaterial !== null && materials.some((material) => material.card.cost < requiredEnergyPerMaterial)) {
    return false;
  }
  if (recipe.requiredTotalEnergy) {
    const totalCost = materials[0].card.cost + materials[1].card.cost;
    return totalCost >= recipe.requiredTotalEnergy;
  }
  return true;
}

function chooseFusionMaterialsFromRecipe(activeEntities: IBoardEntity[], recipe: IFusionRecipe | null): [string, string] | null {
  if (!recipe || activeEntities.length < 2) return null;
  const validPair = buildMaterialPairs(activeEntities).find((materials) =>
    matchesRecipeByMaterialIds(materials, recipe) &&
    matchesRecipeByArchetype(materials, recipe) &&
    matchesRecipeByEnergy(materials, recipe));
  return validPair ? [validPair[0].instanceId, validPair[1].instanceId] : null;
}

export function chooseFusionMaterialsByRecipeId(activeEntities: IBoardEntity[], recipeId: string): [string, string] | null {
  return chooseFusionMaterialsFromRecipe(activeEntities, getFusionRecipeByResultId(recipeId));
}

export function chooseFusionMaterials(opponent: IPlayer, fusionCard: ICard): [string, string] | null {
  return chooseFusionMaterialsFromRecipe(opponent.activeEntities, getFusionRecipe(fusionCard));
}
