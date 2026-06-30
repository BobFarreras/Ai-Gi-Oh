// src/services/training/resolve-training-opponent-loadout.test.ts - Valida resolución de perfil/deck rival de training por tier.
import { describe, expect, it } from "vitest";
import { ICard } from "@/core/entities/ICard";
import { IArenaOpponent } from "@/core/entities/training/IArenaOpponent";
import { resolveTrainingOpponentLoadout } from "@/services/training/resolve-training-opponent-loadout";

describe("resolveTrainingOpponentLoadout", () => {
  it("usa el catálogo de oponentes provisto (BD) y respeta los overrides por carta", () => {
    const card: ICard = { id: "entity-x", name: "X", description: "", type: "ENTITY", faction: "NEUTRAL", cost: 1, attack: 1000, defense: 1000 };
    const cardCatalog = new Map<string, ICard>([["entity-x", card]]);
    const opponents: Record<string, IArenaOpponent> = {
      "training-tier-1": {
        id: "training-tier-1", codeName: "x", displayName: "Custom X", avatarUrl: "a", introUrl: "i", storyOpponentId: "opp-x",
        variants: [{ id: "v1", label: "V1", deckCards: [{ cardId: "entity-x", versionTier: 5, level: 30, xp: 9999 }], fusionCards: [] }],
      },
    };
    const loadout = resolveTrainingOpponentLoadout({ tier: 1, aiDifficulty: "EASY", deckTemplateId: "training-tier-1", tierWins: 0, tierMatches: 0, opponents, cardCatalog });
    expect(loadout.displayName).toBe("Custom X");
    expect(loadout.deckVariantLabel).toBe("V1");
    // El override de carta manda sobre el escalado EASY (versionTier=0).
    expect(loadout.deck[0]?.versionTier).toBe(5);
    expect(loadout.deck[0]?.level).toBe(30);
    expect(loadout.deck[0]?.xp).toBe(9999);
  });

  it("aplica el escalado del tier (defaultScaling) por encima del de la dificultad", () => {
    const card: ICard = { id: "entity-x", name: "X", description: "", type: "ENTITY", faction: "NEUTRAL", cost: 1, attack: 1000, defense: 1000 };
    const cardCatalog = new Map<string, ICard>([["entity-x", card]]);
    const opponents: Record<string, IArenaOpponent> = {
      "training-tier-1": {
        id: "training-tier-1", codeName: "x", displayName: "X", avatarUrl: "a", introUrl: "i", storyOpponentId: "opp-x",
        variants: [{ id: "v1", label: null, deckCards: [{ cardId: "entity-x", versionTier: null, level: null, xp: null }], fusionCards: [] }],
      },
    };
    const loadout = resolveTrainingOpponentLoadout({ tier: 1, aiDifficulty: "EASY", deckTemplateId: "training-tier-1", tierWins: 0, tierMatches: 0, opponents, cardCatalog, defaultScaling: { versionTier: 3, level: 10, xp: 980 } });
    // EASY daría 0/0; el escalado del tier manda → 3/10.
    expect(loadout.deck[0]?.versionTier).toBe(3);
    expect(loadout.deck[0]?.level).toBe(10);
  });

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
    expect(loadout.storyOpponentId).toBe("opp-jaku");
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
    expect(second.displayName).toBe("Helena");
    expect(first.deckVariantId).not.toBe(second.deckVariantId);
  });

  it("incluye roster ampliado en tier 1 con rivales veteranos", () => {
    const jaku = resolveTrainingOpponentLoadout({
      tier: 1,
      aiDifficulty: "NORMAL",
      deckTemplateId: "training-tier-1",
      tierWins: 1,
      tierMatches: 2,
    });
    const bigLog = resolveTrainingOpponentLoadout({
      tier: 1,
      aiDifficulty: "NORMAL",
      deckTemplateId: "training-tier-1",
      tierWins: 1,
      tierMatches: 3,
    });
    const sentinel = resolveTrainingOpponentLoadout({
      tier: 1,
      aiDifficulty: "NORMAL",
      deckTemplateId: "training-tier-1",
      tierWins: 1,
      tierMatches: 4,
    });
    expect(jaku.displayName).toBe("Jaku");
    expect(bigLog.displayName).toBe("BigLog");
    expect(sentinel.displayName).toBe("Soldado");
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

  it("permite escalar dos niveles por encima de BOSS en training", () => {
    const loadout = resolveTrainingOpponentLoadout({
      tier: 5,
      aiDifficulty: "BOSS",
      deckTemplateId: "training-tier-5",
      tierWins: 9,
      tierMatches: 10,
    });
    expect(loadout.difficulty).toBe("MYTHIC");
  });

  it("escala version/level/xp de cartas según dificultad efectiva", () => {
    const easyLoadout = resolveTrainingOpponentLoadout({
      tier: 1,
      aiDifficulty: "EASY",
      deckTemplateId: "training-tier-1",
      tierWins: 0,
      tierMatches: 0,
    });
    const bossLoadout = resolveTrainingOpponentLoadout({
      tier: 5,
      aiDifficulty: "BOSS",
      deckTemplateId: "training-tier-5",
      tierWins: 0,
      tierMatches: 0,
    });
    expect(easyLoadout.deck[0]?.level).toBe(0);
    expect(bossLoadout.deck[0]?.level).toBe(20);
    expect(bossLoadout.deck[0]?.versionTier).toBe(2);
    expect((bossLoadout.deck[0]?.xp ?? 0)).toBeGreaterThan(0);
  });
});
