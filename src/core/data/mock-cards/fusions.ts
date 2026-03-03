import { ICard } from "@/core/entities/ICard";

export const FUSION_CARDS: ICard[] = [
  {
    id: "fusion-gemgpt",
    name: "GemGPT",
    description: "Fusión de ChatGPT y Gemini con salida de alto impacto.",
    type: "FUSION",
    faction: "BIG_TECH",
    cost: 7,
    attack: 3200,
    defense: 2600,
    fusionRecipeId: "fusion-gemgpt",
    fusionMaterials: ["entity-chatgpt", "entity-gemini"],
    fusionEnergyRequirement: 10,
    archetype: "LLM",
    bgUrl: "/assets/bgs/bg-tech.jpg",
    renderUrl: "/assets/renders/gemgpt.png",
  },
];
