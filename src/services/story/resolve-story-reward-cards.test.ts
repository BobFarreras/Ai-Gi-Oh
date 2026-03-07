// src/services/story/resolve-story-reward-cards.test.ts - Valida selección de cartas recompensa Story garantizadas y probabilísticas.
import { describe, expect, it } from "vitest";
import { resolveStoryRewardCards } from "@/services/story/resolve-story-reward-cards";

describe("resolve-story-reward-cards", () => {
  it("siempre incluye recompensas garantizadas", () => {
    const result = resolveStoryRewardCards(
      [
        { cardId: "entity-python", copies: 1, dropRate: 1, isGuaranteed: true },
        { cardId: "entity-gemini", copies: 1, dropRate: 0.2, isGuaranteed: false },
      ],
      () => 0.99,
    );
    expect(result).toContain("entity-python");
  });

  it("incluye recompensas no garantizadas cuando pasa el drop", () => {
    const result = resolveStoryRewardCards([{ cardId: "entity-gemini", copies: 2, dropRate: 0.5, isGuaranteed: false }], () => 0.2);
    expect(result).toEqual(["entity-gemini", "entity-gemini"]);
  });
});
