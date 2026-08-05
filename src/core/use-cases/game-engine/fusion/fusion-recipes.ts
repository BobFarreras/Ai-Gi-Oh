// src/core/use-cases/game-engine/fusion/fusion-recipes.ts - Catálogo de recetas de fusión y utilidades de búsqueda por carta resultado.
import { CardArchetype, ICard } from "@/core/entities/ICard";
import { IPlayer } from "@/core/entities/IPlayer";

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
  // 2º lote. Sin requisitos de energía por material: requiredMaterialIds ya fija el par exacto,
  // y así la IA puede elegir los materiales aunque sean de bajo coste.
  {
    resultCardId: "fusion-curshost",
    requiredMaterialIds: ["entity-cursor", "entity-hostinger"],
  },
  {
    resultCardId: "fusion-kuberlinnet",
    requiredMaterialIds: ["entity-linux", "entity-kubernetes"],
  },
  {
    resultCardId: "fusion-rustyfox",
    requiredMaterialIds: ["entity-rust", "entity-firefox"],
  },
  {
    resultCardId: "fusion-super-c",
    requiredMaterialIds: ["entity-cpp", "entity-csharp"],
  },
];

export function getFusionRecipeByResultId(resultCardId: string): IFusionRecipe | null {
  return FUSION_RECIPES.find((recipe) => recipe.resultCardId === resultCardId) ?? null;
}

export function getFusionRecipe(card: ICard): IFusionRecipe | null {
  if (card.type !== "FUSION") {
    return null;
  }

  // Las cartas hidratadas desde cards_catalog contienen su receta efectiva. Se prioriza ese dato
  // congelado en el snapshot para que un balance del admin no quede eclipsado por presets legacy.
  if (card.fusionMaterials && card.fusionMaterials.length > 0) {
    return {
      resultCardId: card.id,
      requiredMaterialIds: [...card.fusionMaterials],
      ...(card.fusionEnergyRequirement === undefined
        ? {}
        : { requiredTotalEnergy: card.fusionEnergyRequirement }),
    };
  }
  return getFusionRecipeByResultId(card.fusionRecipeId ?? card.id);
}

/** Encuentra la carta resultado dentro del deck fijado para este jugador y combate. */
export function findPlayerFusionCard(player: IPlayer, resultCardId: string): ICard | null {
  return player.fusionDeck?.find((card) => card.type === "FUSION" && card.id === resultCardId) ?? null;
}

/** Resuelve una receta únicamente desde el fusionDeck del snapshot, sin catálogos globales. */
export function getPlayerFusionRecipe(player: IPlayer, resultCardId: string): IFusionRecipe | null {
  const fusionCard = findPlayerFusionCard(player, resultCardId);
  return fusionCard ? getFusionRecipe(fusionCard) : null;
}

