// src/services/training/resolve-training-opponent-loadout.test.ts - Valida resolución de perfil/deck rival de training por tier.
import { describe, expect, it } from "vitest";
import { resolveTrainingOpponentLoadout } from "@/services/training/resolve-training-opponent-loadout";

describe("resolveTrainingOpponentLoadout", () => {
  it("resuelve deck completo y fusión para un tier válido", () => {
    const loadout = resolveTrainingOpponentLoadout({
      tier: 3,
      aiDifficulty: "NORMAL",
      deckTemplateId: "training-tier-3",
      tierWins: 0,
      tierMatches: 0,
    });
    expect(loadout.displayName).toBe("Jaku");
    expect(loadout.deck).toHaveLength(20);
    expect(loadout.fusionDeck.length).toBeGreaterThan(0);
    expect(loadout.difficulty).toBe("NORMAL");
    expect(loadout.storyOpponentId).toBe("opp-ch1-jaku");
    expect(loadout.deckVariantId).toBe("fusion-pressure");
    expect(loadout.deckVariantLabel).toBe("Fusion Pressure");
  });

  it("rota rival dentro del roster del tier según matches jugados", () => {
    const loadout = resolveTrainingOpponentLoadout({
      tier: 3,
      aiDifficulty: "NORMAL",
      deckTemplateId: "training-tier-3",
      tierWins: 1,
      tierMatches: 1,
    });
    expect(loadout.displayName).toBe("Helena");
  });

  it("rota variante de mazo dentro del mismo rival por arquetipo", () => {
    const first = resolveTrainingOpponentLoadout({
      tier: 1,
      aiDifficulty: "NORMAL",
      deckTemplateId: "training-tier-1",
      tierWins: 1,
      tierMatches: 0,
    });
    const second = resolveTrainingOpponentLoadout({
      tier: 1,
      aiDifficulty: "NORMAL",
      deckTemplateId: "training-tier-1",
      tierWins: 1,
      tierMatches: 1,
    });
    expect(first.displayName).toBe("GenNvim");
    expect(second.displayName).toBe("NanoOps");
    expect(first.deckVariantId).not.toBe(second.deckVariantId);
  });

  it("sube dificultad cuando el winrate del tier es alto", () => {
    const loadout = resolveTrainingOpponentLoadout({
      tier: 3,
      aiDifficulty: "NORMAL",
      deckTemplateId: "training-tier-3",
      tierWins: 6,
      tierMatches: 7,
    });
    expect(loadout.difficulty).toBe("BOSS");
  });

  it("falla si el template no existe", () => {
    expect(() =>
      resolveTrainingOpponentLoadout({
        tier: 9,
        aiDifficulty: "BOSS",
        deckTemplateId: "training-tier-unknown",
        tierWins: 0,
        tierMatches: 0,
      }),
    ).toThrowError();
  });
});
