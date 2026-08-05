// src/core/services/opponent/opponent-fusion-execution.ts - Utilidades para razonar activación de mágicas de fusión y materiales faltantes del rival.
import { CardArchetype, ICard } from "@/core/entities/ICard";
import { IPlayer } from "@/core/entities/IPlayer";
import { chooseFusionMaterialsByRecipeId } from "@/core/services/opponent/heuristic-fusion-materials";
import { getPlayerFusionRecipe } from "@/core/use-cases/game-engine/fusion/fusion-recipes";

interface IFusionMaterialGaps {
  missingCardIds: string[];
  missingArchetypes: CardArchetype[];
}

function resolveFusionCardFromDeck(opponent: IPlayer, recipeId: string): ICard | null {
  const fusionCard = opponent.fusionDeck?.find((card) => card.id === recipeId) ?? null;
  return fusionCard?.type === "FUSION" ? fusionCard : null;
}

export function canActivateFusionExecutionNow(opponent: IPlayer, executionCard: ICard): boolean {
  if (executionCard.type !== "EXECUTION" || executionCard.effect?.action !== "FUSION_SUMMON") return false;
  const recipeId = executionCard.effect.recipeId;
  if (!recipeId) return false;
  const fusionCard = resolveFusionCardFromDeck(opponent, recipeId);
  if (!fusionCard) return false;
  return chooseFusionMaterialsByRecipeId(opponent.activeEntities, recipeId, opponent.fusionDeck) !== null;
}

/** ¿La receta ya tiene sus 2 materiales en mesa listos para fusionar? */
function fusionReady(opponent: IPlayer, recipeId: string): boolean {
  return chooseFusionMaterialsByRecipeId(opponent.activeEntities, recipeId, opponent.fusionDeck) !== null;
}

/**
 * Recetas hacia las que la IA está TRABAJANDO ahora mismo: tiene el ejecutable FUSION_SUMMON (en mano o ya
 * SET en el tablero) y la carta resultado en su fusionDeck. Sirve para proteger sus materiales (invocarlos en
 * defensa, no atacar con ellos) hasta completar la fusión.
 */
export function workingFusionRecipeIds(opponent: IPlayer): string[] {
  const fromHand = opponent.hand;
  const fromBoard = opponent.activeExecutions.map((entity) => entity.card);
  const recipeIds = new Set<string>();
  for (const card of [...fromHand, ...fromBoard]) {
    if (card.type !== "EXECUTION" || card.effect?.action !== "FUSION_SUMMON") continue;
    const recipeId = card.effect.recipeId;
    if (recipeId && resolveFusionCardFromDeck(opponent, recipeId)) recipeIds.add(recipeId);
  }
  return [...recipeIds];
}

/** ¿Esta entity propia es material requerido de alguna fusión pendiente (aún no completada)? Protegerla. */
export function isPendingFusionMaterial(card: ICard, opponent: IPlayer): boolean {
  for (const recipeId of workingFusionRecipeIds(opponent)) {
    if (fusionReady(opponent, recipeId)) continue; // ya tiene el par: se activará, no hace falta seguir protegiendo
    const recipe = getPlayerFusionRecipe(opponent, recipeId);
    const isRequiredId = Boolean(recipe?.requiredMaterialIds?.includes(card.id));
    const isRequiredArch = Boolean(card.archetype && recipe?.requiredArchetypes?.includes(card.archetype));
    if (isRequiredId || isRequiredArch) return true;
  }
  return false;
}

export function resolveFusionMaterialGaps(opponent: IPlayer, recipeId: string): IFusionMaterialGaps {
  const recipe = getPlayerFusionRecipe(opponent, recipeId);
  if (!recipe) return { missingCardIds: [], missingArchetypes: [] };
  const activeCardIds = opponent.activeEntities.map((entity) => entity.card.id);
  const pendingArchetypes = [...(recipe.requiredArchetypes ?? [])];
  for (const entity of opponent.activeEntities) {
    const archetype = entity.card.archetype;
    if (!archetype) continue;
    const index = pendingArchetypes.indexOf(archetype);
    if (index >= 0) pendingArchetypes.splice(index, 1);
  }
  return {
    missingCardIds: (recipe.requiredMaterialIds ?? []).filter((requiredId) => !activeCardIds.includes(requiredId)),
    missingArchetypes: pendingArchetypes,
  };
}
