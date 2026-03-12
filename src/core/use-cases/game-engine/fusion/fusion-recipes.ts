// src/core/use-cases/game-engine/fusion/fusion-recipes.ts - Catálogo de recetas de fusión y utilidades de búsqueda por carta resultado.
import { CardArchetype, ICard } from "@/core/entities/ICard";

export interface IFusionRecipe {
  resultCardId: string;
  requiredMaterialIds?: string[];
  requiredArchetypes?: CardArchetype[];
  requiredEnergyPerMaterial?: number;
  requiredTotalEnergy?: number;
}

const FUSION_RECIPES: IFusionRecipe[] = [
  {
    resultCardId: "fusion-p1-overmind",
    requiredArchetypes: ["LLM", "LLM"],
    requiredEnergyPerMaterial: 2,
    requiredTotalEnergy: 4,
  },
  {
    resultCardId: "fusion-p2-overmind",
    requiredArchetypes: ["LLM", "LLM"],
    requiredEnergyPerMaterial: 2,
    requiredTotalEnergy: 4,
  },
  {
    resultCardId: "fusion-gemgpt",
    requiredMaterialIds: ["entity-chatgpt", "entity-gemini"],
    requiredEnergyPerMaterial: 5,
    requiredTotalEnergy: 10,
  },
  {
    resultCardId: "fusion-kaclauli",
    requiredMaterialIds: ["entity-claude", "entity-kali-linux"],
    requiredEnergyPerMaterial: 4,
    requiredTotalEnergy: 9,
  },
  {
    resultCardId: "fusion-pytgress",
    requiredMaterialIds: ["entity-python", "entity-postgress"],
    requiredEnergyPerMaterial: 4,
    requiredTotalEnergy: 8,
  },
];

export function getFusionRecipeByResultId(resultCardId: string): IFusionRecipe | null {
  return FUSION_RECIPES.find((recipe) => recipe.resultCardId === resultCardId) ?? null;
}

export function getFusionRecipe(card: ICard): IFusionRecipe | null {
  if (card.type !== "FUSION") {
    return null;
  }

  if (card.fusionRecipeId) {
    return getFusionRecipeByResultId(card.fusionRecipeId);
  }

  return getFusionRecipeByResultId(card.id);
}

