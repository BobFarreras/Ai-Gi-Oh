// src/core/services/effects/execution-buff-detection.test.ts - Detección de magias que aplican buff.
import { describe, expect, it } from "vitest";
import { executionEffectAppliesBuff } from "./execution-buff-detection";

describe("executionEffectAppliesBuff", () => {
  it("es true para acciones de buff positivo", () => {
    expect(executionEffectAppliesBuff({ action: "BOOST_ATTACK_ALLIED_ENTITY", value: 400 })).toBe(true);
    expect(executionEffectAppliesBuff({ action: "BOOST_DEFENSE_BY_ARCHETYPE", archetype: "TOOL", value: 200 })).toBe(true);
    expect(executionEffectAppliesBuff({ action: "BOOST_ATTACK_BY_CARD_ID", targetCardId: "x", value: 1000 })).toBe(true);
  });

  it("es false para magias que no buffean o sin efecto", () => {
    expect(executionEffectAppliesBuff({ action: "DAMAGE", target: "OPPONENT", value: 600 })).toBe(false);
    expect(executionEffectAppliesBuff({ action: "DRAW_CARD", cards: 1 })).toBe(false);
    expect(executionEffectAppliesBuff(undefined)).toBe(false);
  });
});
