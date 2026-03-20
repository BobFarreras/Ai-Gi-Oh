// src/services/training/resolve-training-opponent-loadout.test.ts - Valida resolución de perfil/deck rival de training por tier.
import { describe, expect, it } from "vitest";
import { resolveTrainingOpponentLoadout } from "@/services/training/resolve-training-opponent-loadout";

describe("resolveTrainingOpponentLoadout", () => {
  it("resuelve deck completo y fusión para un tier válido", () => {
    const loadout = resolveTrainingOpponentLoadout({ tier: 3, aiDifficulty: "NORMAL", deckTemplateId: "training-tier-3" });
    expect(loadout.displayName).toBe("Jaku");
    expect(loadout.deck).toHaveLength(20);
    expect(loadout.fusionDeck.length).toBeGreaterThan(0);
    expect(loadout.difficulty).toBe("NORMAL");
  });

  it("falla si el template no existe", () => {
    expect(() =>
      resolveTrainingOpponentLoadout({ tier: 9, aiDifficulty: "BOSS", deckTemplateId: "training-tier-unknown" }),
    ).toThrowError();
  });
});
