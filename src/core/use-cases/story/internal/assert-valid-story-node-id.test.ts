// src/core/use-cases/story/internal/assert-valid-story-node-id.test.ts - Comprueba validación de formato de nodeId en flujos Story.
import { assertValidStoryNodeId } from "@/core/use-cases/story/internal/assert-valid-story-node-id";

describe("assertValidStoryNodeId", () => {
  it("acepta id canónico", () => {
    expect(() => assertValidStoryNodeId("story-ch1-duel-1")).not.toThrow();
  });

  it("rechaza id con caracteres no válidos", () => {
    expect(() => assertValidStoryNodeId("story/ch1/duel/1")).toThrow("Identificador de nodo Story inválido.");
  });
});
