// src/services/training/resolve-training-opponent-loadout.test.ts - Valida el ladder fijo de 8 rivales de arena (orden por victorias, fuerza por tier).
import { describe, expect, it } from "vitest";
import { ICard } from "@/core/entities/ICard";
import { IArenaOpponent } from "@/core/entities/training/IArenaOpponent";
import { resolveTrainingOpponentLoadout } from "@/services/training/resolve-training-opponent-loadout";

describe("resolveTrainingOpponentLoadout", () => {
  it("enfrenta a los 8 rivales del ladder en orden por victorias del nivel", () => {
    const names = Array.from({ length: 8 }, (_, wins) =>
      resolveTrainingOpponentLoadout({ tier: 1, aiDifficulty: "EASY", tierWins: wins, tierMatches: 0 }).displayName,
    );
    expect(names).toEqual(["GenNvim", "Helena", "Jaku", "Mouretech", "Soldado", "Guill", "Soldado-Laptop", "Gokernel"]);
  });

  it("usa el mismo roster en cualquier nivel (solo cambia la fuerza)", () => {
    const lvl1 = resolveTrainingOpponentLoadout({ tier: 1, aiDifficulty: "EASY", tierWins: 0, tierMatches: 0 });
    const lvl6 = resolveTrainingOpponentLoadout({ tier: 6, aiDifficulty: "MYTHIC", tierWins: 0, tierMatches: 0 });
    expect(lvl1.displayName).toBe("GenNvim");
    expect(lvl6.displayName).toBe("GenNvim");
    expect(lvl1.ladderSize).toBe(8);
  });

  it("deja a BigLog fuera del ladder (no aparece en ninguna posición)", () => {
    const names = Array.from({ length: 8 }, (_, wins) =>
      resolveTrainingOpponentLoadout({ tier: 2, aiDifficulty: "NORMAL", tierWins: wins, tierMatches: 0 }).displayName,
    );
    expect(names).not.toContain("BigLog");
  });

  it("cierra el ladder con Gokernel como combate final (8º)", () => {
    const loadout = resolveTrainingOpponentLoadout({ tier: 1, aiDifficulty: "EASY", tierWins: 7, tierMatches: 0 });
    expect(loadout.ladderIndex).toBe(7);
    expect(loadout.ladderSize).toBe(8);
    expect(loadout.displayName).toBe("Gokernel");
    expect(loadout.storyOpponentId).toBe("opp-gokernel");
  });

  it("expone ladderIndex y ladderSize del combate actual", () => {
    const loadout = resolveTrainingOpponentLoadout({ tier: 1, aiDifficulty: "EASY", tierWins: 3, tierMatches: 0 });
    expect(loadout.ladderIndex).toBe(3);
    expect(loadout.ladderSize).toBe(8);
    expect(loadout.displayName).toBe("Mouretech");
    expect(loadout.storyOpponentId).toBe("opp-mouretech");
  });

  it("mantiene la dificultad fija del tier (sin adaptar por winrate)", () => {
    const loadout = resolveTrainingOpponentLoadout({ tier: 3, aiDifficulty: "HARD", tierWins: 5, tierMatches: 20 });
    expect(loadout.difficulty).toBe("HARD");
  });

  it("rota la variante de mazo del mismo rival por combates jugados", () => {
    const opponents: Record<string, IArenaOpponent> = {
      "training-tier-1": {
        id: "training-tier-1", codeName: "x", displayName: "X", avatarUrl: "a", introUrl: "i", storyOpponentId: "opp-x",
        variants: [
          { id: "v1", label: "V1", deckCards: [], fusionCards: [] },
          { id: "v2", label: "V2", deckCards: [], fusionCards: [] },
        ],
      },
    };
    const first = resolveTrainingOpponentLoadout({ tier: 1, aiDifficulty: "EASY", tierWins: 0, tierMatches: 0, opponents });
    const second = resolveTrainingOpponentLoadout({ tier: 1, aiDifficulty: "EASY", tierWins: 0, tierMatches: 1, opponents });
    expect(first.deckVariantId).toBe("v1");
    expect(second.deckVariantId).toBe("v2");
  });

  it("respeta los overrides por carta del catálogo provisto (BD)", () => {
    const card: ICard = { id: "entity-x", name: "X", description: "", type: "ENTITY", faction: "NEUTRAL", cost: 1, attack: 1000, defense: 1000 };
    const cardCatalog = new Map<string, ICard>([["entity-x", card]]);
    const opponents: Record<string, IArenaOpponent> = {
      "training-tier-1": {
        id: "training-tier-1", codeName: "x", displayName: "Custom X", avatarUrl: "a", introUrl: "i", storyOpponentId: "opp-x",
        variants: [{ id: "v1", label: "V1", deckCards: [{ cardId: "entity-x", versionTier: 5, level: 30, xp: 9999 }], fusionCards: [] }],
      },
    };
    const loadout = resolveTrainingOpponentLoadout({ tier: 1, aiDifficulty: "EASY", tierWins: 0, tierMatches: 0, opponents, cardCatalog });
    expect(loadout.displayName).toBe("Custom X");
    expect(loadout.deck[0]?.versionTier).toBe(5);
    expect(loadout.deck[0]?.level).toBe(30);
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
    const loadout = resolveTrainingOpponentLoadout({ tier: 1, aiDifficulty: "EASY", tierWins: 0, tierMatches: 0, opponents, cardCatalog, defaultScaling: { versionTier: 3, level: 10, xp: 980 } });
    expect(loadout.deck[0]?.versionTier).toBe(3);
    expect(loadout.deck[0]?.level).toBe(10);
  });

  it("aplica los bonus de combate por nivel a las cartas del oponente", () => {
    const card: ICard = { id: "entity-x", name: "X", description: "", type: "ENTITY", faction: "NEUTRAL", cost: 3, attack: 1000, defense: 1000 };
    const cardCatalog = new Map<string, ICard>([["entity-x", card]]);
    const opponents: Record<string, IArenaOpponent> = {
      "training-tier-1": {
        id: "training-tier-1", codeName: "x", displayName: "X", avatarUrl: "a", introUrl: "i", storyOpponentId: "opp-x",
        variants: [{ id: "v1", label: null, deckCards: [{ cardId: "entity-x", versionTier: null, level: null, xp: null }], fusionCards: [] }],
      },
    };
    const baseInput = { tier: 1, aiDifficulty: "EASY" as const, tierWins: 0, tierMatches: 0, opponents, cardCatalog };
    const atLevel10 = resolveTrainingOpponentLoadout({ ...baseInput, defaultScaling: { versionTier: 1, level: 10, xp: 980 } });
    const atLevel20 = resolveTrainingOpponentLoadout({ ...baseInput, defaultScaling: { versionTier: 2, level: 20, xp: 2800 } });
    // El rival escala con las MISMAS reglas que el jugador (resolveCardLevelBonuses): nivel 10 → +150 ATK
    // (hitos 5 y 10, ambos de ataque); nivel 20 → +150 ATK (los hitos 15 y 20 son de defensa).
    expect(atLevel10.deck[0]?.attack).toBe(1150);
    expect(atLevel20.deck[0]?.attack).toBe(1150);
    // La defensa sí sube entre el 10 y el 20 (hitos 15 y 20): es el ciclo de la curva.
    expect(atLevel10.deck[0]?.defense).toBe(1000);
    expect(atLevel20.deck[0]?.defense).toBe(1150);
  });

  it("resuelve deck completo (20) y fusión para un rival del roster", () => {
    const loadout = resolveTrainingOpponentLoadout({ tier: 3, aiDifficulty: "NORMAL", tierWins: 2, tierMatches: 0 });
    expect(loadout.displayName).toBe("Jaku");
    expect(loadout.storyOpponentId).toBe("opp-jaku");
    expect(loadout.deck).toHaveLength(20);
    expect(loadout.fusionDeck.length).toBeGreaterThan(0);
  });

  it("lanza si no hay oponentes disponibles para el ladder", () => {
    expect(() =>
      resolveTrainingOpponentLoadout({ tier: 1, aiDifficulty: "EASY", tierWins: 0, tierMatches: 0, opponents: {} }),
    ).toThrowError();
  });
});
