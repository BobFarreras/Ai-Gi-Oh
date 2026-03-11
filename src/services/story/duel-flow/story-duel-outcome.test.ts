// src/services/story/duel-flow/story-duel-outcome.test.ts - Pruebas del contrato canónico de resultados Story.
import { describe, expect, it } from "vitest";
import { didWinFromStoryOutcome, isStoryDuelOutcome } from "./story-duel-outcome";

describe("story-duel-outcome", () => {
  it("valida outcomes soportados", () => {
    expect(isStoryDuelOutcome("WON")).toBe(true);
    expect(isStoryDuelOutcome("LOST")).toBe(true);
    expect(isStoryDuelOutcome("ABANDONED")).toBe(true);
    expect(isStoryDuelOutcome("DRAW")).toBe(false);
  });

  it("traduce a didWin para persistencia legacy", () => {
    expect(didWinFromStoryOutcome("WON")).toBe(true);
    expect(didWinFromStoryOutcome("LOST")).toBe(false);
    expect(didWinFromStoryOutcome("ABANDONED")).toBe(false);
  });
});
