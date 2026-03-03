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
];

export function getFusionRecipe(card: ICard): IFusionRecipe | null {
  if (card.type !== "FUSION") {
    return null;
  }

  if (card.fusionRecipeId) {
    return FUSION_RECIPES.find((recipe) => recipe.resultCardId === card.fusionRecipeId) ?? null;
  }

  return FUSION_RECIPES.find((recipe) => recipe.resultCardId === card.id) ?? null;
}
