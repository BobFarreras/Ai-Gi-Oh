// src/core/services/opponent/opponent-fusion-execution.ts - Utilidades para razonar activación de mágicas de fusión y materiales faltantes del rival.
import { CardArchetype, ICard } from "@/core/entities/ICard";
import { IPlayer } from "@/core/entities/IPlayer";
import { chooseFusionMaterialsByRecipeId } from "@/core/services/opponent/heuristic-fusion-materials";
import { getFusionRecipeByResultId } from "@/core/use-cases/game-engine/fusion/fusion-recipes";

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
  return chooseFusionMaterialsByRecipeId(opponent.activeEntities, recipeId) !== null;
}

export function resolveFusionMaterialGaps(opponent: IPlayer, recipeId: string): IFusionMaterialGaps {
  const recipe = getFusionRecipeByResultId(recipeId);
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
