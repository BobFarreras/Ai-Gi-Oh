// src/services/olympus/resolve-olympus-loadouts.test.ts - Verifica el escalado del deck prestado y la hidratación del deck legendario.
import { describe, expect, it } from "vitest";
import { ICard } from "@/core/entities/ICard";
import { IArenaOpponent } from "@/core/entities/training/IArenaOpponent";
import { IOlympusChampion } from "@/core/entities/olympus/IOlympus";
import { IOlympusChampionBattleProfile } from "@/core/services/olympus/resolve-champion-battle-profile";
import { IOlympusLegendDeckEntry } from "@/core/repositories/IOlympusRepository";
import { resolveChampionLoadout, resolveLegendLoadout } from "./resolve-olympus-loadouts";

function card(id: string): ICard {
  return {
    id, name: id, type: "ENTITY", cost: 3, attack: 1000, defense: 800,
    renderUrl: null, masteryPassiveSkillId: null,
  } as unknown as ICard;
}

const cardCatalog = new Map<string, ICard>([
  ["entity-a", card("entity-a")],
  ["entity-b", card("entity-b")],
  ["fusion-a", card("fusion-a")],
]);

const deckEntry = (cardId: string) => ({
  cardId, versionTier: null, level: null, xp: null, attackBonus: null, defenseBonus: null,
});

const opponents: Record<string, IArenaOpponent> = {
  "training-tier-1": {
    id: "training-tier-1", codeName: "GENNVIM", displayName: "GenNvim",
    avatarUrl: "/avatar.webp", introUrl: "/intro.webp", storyOpponentId: "gennvim",
    variants: [{
      id: "starter-tools",
      label: "Starter Tools",
      deckCards: [deckEntry("entity-a"), deckEntry("entity-b")],
      fusionCards: [deckEntry("fusion-a")],
    }],
  },
};

const champion: IOlympusChampion = {
  id: "gennvim", arenaOpponentId: "training-tier-1", requiredTier: 1, requiredLadderPosition: 1,
  baseDeckVariantId: "starter-tools", baseScale: { level: 14, versionTier: 2, startingLp: 8000 }, version: 1,
};

const profile: IOlympusChampionBattleProfile = {
  level: 20, versionTier: 4, xp: 6533,
  signatureCardIds: [], signatureLevel: 25, startingLp: 8000, energyBonus: 0,
};

describe("resolveChampionLoadout", () => {
  it("aplica el nivel resuelto al deck y el nivel emblemático al fusion deck", () => {
    const loadout = resolveChampionLoadout(champion, opponents, cardCatalog, profile);
    expect(loadout.deck.map((entry) => entry.level)).toEqual([20, 20]);
    expect(loadout.fusionDeck.map((entry) => entry.level)).toEqual([25]);
    expect(loadout.displayName).toBe("GenNvim");
  });

  it("restringe el nivel emblemático a las cartas seleccionadas cuando el nodo declara selector", () => {
    const selected = { ...profile, signatureCardIds: ["entity-a"] };
    const loadout = resolveChampionLoadout(champion, opponents, cardCatalog, selected);
    expect(loadout.deck.map((entry) => entry.level)).toEqual([25, 20]);
    // Con selector explícito el fusion deck deja de subir por defecto.
    expect(loadout.fusionDeck.map((entry) => entry.level)).toEqual([20]);
  });

  it("falla si el campeón perdió su variante publicada", () => {
    expect(() => resolveChampionLoadout(
      { ...champion, baseDeckVariantId: "inexistente" }, opponents, cardCatalog, profile,
    )).toThrow(/variante de mazo/i);
  });

  it("falla si el rival de Arena ya no existe", () => {
    expect(() => resolveChampionLoadout(champion, {}, cardCatalog, profile))
      .toThrow(/rival de Arena/i);
  });
});

describe("resolveLegendLoadout", () => {
  const entries: IOlympusLegendDeckEntry[] = [
    { zone: "FUSION", position: 1, cardId: "fusion-a", level: 30, xp: 9800, versionTier: 5, attackBonus: 300, defenseBonus: 200 },
    { zone: "DECK", position: 2, cardId: "entity-b", level: 30, xp: 9800, versionTier: 5, attackBonus: 300, defenseBonus: 200 },
    { zone: "DECK", position: 1, cardId: "entity-a", level: 30, xp: 9800, versionTier: 5, attackBonus: 300, defenseBonus: 200 },
  ];

  it("separa zonas, respeta la posición y aplica los bonus persistidos", () => {
    const loadout = resolveLegendLoadout(entries, cardCatalog);
    expect(loadout.deck.map((entry) => entry.id)).toEqual(["entity-a", "entity-b"]);
    expect(loadout.fusionDeck.map((entry) => entry.id)).toEqual(["fusion-a"]);
    expect(loadout.deck[0]).toMatchObject({ level: 30, versionTier: 5 });
    expect(loadout.deck[0].attack).toBeGreaterThan(1300);
  });

  it("falla si la leyenda se publicó sin deck", () => {
    expect(() => resolveLegendLoadout([], cardCatalog)).toThrow(/no tiene deck publicado/i);
  });
});
