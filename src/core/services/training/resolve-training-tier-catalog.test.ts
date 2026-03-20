// src/core/services/training/resolve-training-tier-catalog.test.ts - Pruebas del catálogo editable de tiers de entrenamiento.
import { describe, expect, it } from "vitest";
import { ValidationError } from "@/core/errors/ValidationError";
import { resolveTrainingTierCatalog } from "./resolve-training-tier-catalog";

describe("resolveTrainingTierCatalog", () => {
  it("expone catálogo por defecto válido y ordenado", () => {
    const catalog = resolveTrainingTierCatalog();
    expect(catalog.map((item) => item.tier)).toEqual([1, 2, 3, 4, 5]);
    expect(catalog[0]?.requiredWinsInPreviousTier).toBe(0);
    expect(catalog[1]?.requiredWinsInPreviousTier).toBe(5);
  });

  it("permite inyectar catálogo personalizado para balanceo", () => {
    const catalog = resolveTrainingTierCatalog({
      tiers: [
        { tier: 1, code: "t1", requiredWinsInPreviousTier: 0, aiDifficulty: "EASY", deckTemplateId: "deck-a", rewardMultiplier: 1 },
        { tier: 2, code: "t2", requiredWinsInPreviousTier: 1, aiDifficulty: "NORMAL", deckTemplateId: "deck-b", rewardMultiplier: 1.2 },
      ],
    });
    expect(catalog).toHaveLength(2);
    expect(catalog[1]?.code).toBe("t2");
  });

  it("rechaza catálogos desordenados o tier inicial inválido", () => {
    expect(() =>
      resolveTrainingTierCatalog({
        tiers: [
          { tier: 2, code: "t2", requiredWinsInPreviousTier: 1, aiDifficulty: "NORMAL", deckTemplateId: "deck-b", rewardMultiplier: 1.1 },
          { tier: 1, code: "t1", requiredWinsInPreviousTier: 0, aiDifficulty: "EASY", deckTemplateId: "deck-a", rewardMultiplier: 1 },
        ],
      }),
    ).toThrow(ValidationError);

    expect(() =>
      resolveTrainingTierCatalog({
        tiers: [{ tier: 1, code: "t1", requiredWinsInPreviousTier: 2, aiDifficulty: "EASY", deckTemplateId: "deck-a", rewardMultiplier: 1 }],
      }),
    ).toThrow(ValidationError);
  });
});
