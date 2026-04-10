// src/core/services/opponent/heuristic-fusion-materials.test.ts - Verifica validación de materiales de fusión por ids/arquetipos para la IA rival.
import { describe, expect, it } from "vitest";
import { chooseFusionMaterialsByRecipeId } from "@/core/services/opponent/heuristic-fusion-materials";
import { IBoardEntity } from "@/core/entities/IPlayer";

function createEntity(instanceId: string, cardId: string, archetype: "LLM" | "FRAMEWORK" | "DB" | "IDE" | "LANGUAGE" | "TOOL" | "SECURITY"): IBoardEntity {
  return {
    instanceId,
    card: {
      id: cardId,
      name: cardId,
      description: "",
      type: "ENTITY",
      faction: "OPEN_SOURCE",
      cost: 5,
      attack: 1000,
      defense: 1000,
      archetype,
    },
    mode: "ATTACK",
    hasAttackedThisTurn: false,
    isNewlySummoned: false,
  };
}

describe("chooseFusionMaterialsByRecipeId", () => {
  it("rechaza pares sin los ids exactos requeridos por la receta", () => {
    const activeEntities = [
      createEntity("mat-1", "entity-chatgpt", "LLM"),
      createEntity("mat-2", "entity-claude", "LLM"),
    ];

    const selected = chooseFusionMaterialsByRecipeId(activeEntities, "fusion-gemgpt");
    expect(selected).toBeNull();
  });

  it("acepta pares con ids requeridos cuando la receta se cumple", () => {
    const activeEntities = [
      createEntity("mat-1", "entity-chatgpt", "LLM"),
      createEntity("mat-2", "entity-gemini", "LLM"),
      createEntity("mat-3", "entity-python", "LANGUAGE"),
    ];

    const selected = chooseFusionMaterialsByRecipeId(activeEntities, "fusion-gemgpt");
    expect(selected).toEqual(["mat-1", "mat-2"]);
  });
});
