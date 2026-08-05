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

function chooseFusionMaterialsFromRecipe(activeEntities: IBoardEntity[], recipe: IFusionRecipe | null): [string, string] | null {
  if (!recipe || activeEntities.length < 2) return null;
  // IMPORTANTE: el matcher debe reflejar EXACTAMENTE lo que el motor valida (validate-materials-against-recipe):
  // SOLO requiredMaterialIds + requiredArchetypes. Los campos requiredEnergyPerMaterial/requiredTotalEnergy de
  // las recetas son letra muerta (el motor los ignora: validateFusionEnergy es no-op). Si la IA los exigía,
  // rechazaba pares que el jugador SÍ puede fusionar (p.ej. fusion-pytgress: python cost 3 < 4 exigido) y JAMÁS
  // reconocía que podía fusionar → 0 fusiones. Alineado con el motor, la IA ya monta la fusión.
  const validPair = buildMaterialPairs(activeEntities).find((materials) =>
    matchesRecipeByMaterialIds(materials, recipe) &&
    matchesRecipeByArchetype(materials, recipe));
  return validPair ? [validPair[0].instanceId, validPair[1].instanceId] : null;
}

export function chooseFusionMaterialsByRecipeId(
  activeEntities: IBoardEntity[],
  recipeId: string,
  fusionDeck?: readonly ICard[],
): [string, string] | null {
  const snapshotCard = fusionDeck?.find((card) => card.type === "FUSION" && card.id === recipeId);
  return chooseFusionMaterialsFromRecipe(
    activeEntities,
    snapshotCard ? getFusionRecipe(snapshotCard) : getFusionRecipeByResultId(recipeId),
  );
}

export function chooseFusionMaterials(opponent: IPlayer, fusionCard: ICard): [string, string] | null {
  return chooseFusionMaterialsFromRecipe(opponent.activeEntities, getFusionRecipe(fusionCard));
}
