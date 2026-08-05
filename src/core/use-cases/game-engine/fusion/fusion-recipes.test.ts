// src/core/use-cases/game-engine/fusion/fusion-recipes.test.ts - Verifica que todas las fusiones del catálogo tengan receta (si no, no se podrían invocar).
import { describe, expect, it } from "vitest";
import { ICard } from "@/core/entities/ICard";
import { getFusionRecipe, getFusionRecipeByResultId } from "@/core/use-cases/game-engine/fusion/fusion-recipes";

describe("fusion-recipes", () => {
  it("prioriza los materiales configurados en la carta del snapshot", () => {
    const card = {
      id: "fusion-gemgpt", type: "FUSION", fusionRecipeId: "fusion-gemgpt",
      fusionMaterials: ["entity-custom-a", "entity-custom-b"], fusionEnergyRequirement: 7,
    } as ICard;

    expect(getFusionRecipe(card)).toEqual({
      resultCardId: "fusion-gemgpt",
      requiredMaterialIds: ["entity-custom-a", "entity-custom-b"],
      requiredTotalEnergy: 7,
    });
  });

  it.each([
    ["fusion-curshost", ["entity-cursor", "entity-hostinger"]],
    ["fusion-kuberlinnet", ["entity-linux", "entity-kubernetes"]],
    ["fusion-rustyfox", ["entity-rust", "entity-firefox"]],
    ["fusion-super-c", ["entity-cpp", "entity-csharp"]],
  ])("la fusión %s tiene receta con sus materiales", (resultId, materials) => {
    const recipe = getFusionRecipeByResultId(resultId);
    expect(recipe).not.toBeNull();
    expect(recipe?.requiredMaterialIds).toEqual(materials);
  });
});
