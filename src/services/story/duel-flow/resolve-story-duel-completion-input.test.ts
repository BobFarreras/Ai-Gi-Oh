// src/services/story/duel-flow/resolve-story-duel-completion-input.test.ts - Valida normalización de payload de cierre Story.
import { describe, expect, it } from "vitest";
import { resolveStoryDuelCompletionInput } from "./resolve-story-duel-completion-input";

describe("resolveStoryDuelCompletionInput", () => {
  it("acepta contrato nuevo basado en outcome", () => {
    const resolved = resolveStoryDuelCompletionInput({
      chapter: 1,
      duelIndex: 2,
      outcome: "ABANDONED",
    });
    expect(resolved).toEqual({ chapter: 1, duelIndex: 2, outcome: "ABANDONED" });
  });

  it("mantiene compatibilidad con didWin", () => {
    const resolved = resolveStoryDuelCompletionInput({
      chapter: 1,
      duelIndex: 3,
      didWin: true,
    });
    expect(resolved).toEqual({ chapter: 1, duelIndex: 3, outcome: "WON" });
  });

  it("rechaza payload inválido", () => {
    const resolved = resolveStoryDuelCompletionInput({
      chapter: 0,
      duelIndex: 1,
      didWin: true,
    });
    expect(resolved).toBeNull();
  });
});
