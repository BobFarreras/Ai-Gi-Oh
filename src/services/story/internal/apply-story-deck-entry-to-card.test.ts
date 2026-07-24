// src/services/story/internal/apply-story-deck-entry-to-card.test.ts - El nivel que pone el admin TIENE que
// notarse en el duelo de Story: era el bug por el que un rival "de nivel 50" pegaba como uno de nivel 0.
import { describe, expect, it } from "vitest";
import { ICard } from "@/core/entities/ICard";
import { IStoryDeckEntryDefinition } from "@/core/entities/opponent/IStoryDuelDefinition";
import { applyStoryDeckEntryToCard } from "./apply-story-deck-entry-to-card";

const ENTITY_CARD: ICard = {
  id: "flutter",
  name: "Flutter",
  description: "Carta de prueba",
  type: "ENTITY",
  faction: "OPEN_SOURCE",
  cost: 4,
  attack: 1000,
  defense: 900,
};

function buildEntry(overrides: Partial<IStoryDeckEntryDefinition> = {}): IStoryDeckEntryDefinition {
  return {
    cardId: ENTITY_CARD.id,
    versionTier: 0,
    level: 0,
    xp: 0,
    attackOverride: null,
    defenseOverride: null,
    effectOverride: null,
    ...overrides,
  };
}

describe("applyStoryDeckEntryToCard", () => {
  it("aplica la curva de nivel a los stats del rival", () => {
    // Hitos hasta el 20: +50 ATK (5), +100 ATK (10), +50 DEF (15), +100 DEF (20) ⇒ +150/+150.
    const card = applyStoryDeckEntryToCard(ENTITY_CARD, buildEntry({ level: 20 }));
    expect(card.attack).toBe(1150);
    expect(card.defense).toBe(1050);
    expect(card.level).toBe(20);
  });

  it("suma la curva SOBRE el override de atributos (objetos equipados en el admin)", () => {
    const card = applyStoryDeckEntryToCard(ENTITY_CARD, buildEntry({ level: 10, attackOverride: 3000, defenseOverride: 200 }));
    expect(card.attack).toBe(3150);
    expect(card.defense).toBe(200);
  });

  it("abarata la carta 1 de energía a partir del nivel 50, como al jugador", () => {
    expect(applyStoryDeckEntryToCard(ENTITY_CARD, buildEntry({ level: 49 })).cost).toBe(4);
    expect(applyStoryDeckEntryToCard(ENTITY_CARD, buildEntry({ level: 50 })).cost).toBe(3);
  });

  it("deja la carta intacta a nivel 0 y conserva versión/efecto del override", () => {
    const card = applyStoryDeckEntryToCard(ENTITY_CARD, buildEntry({ versionTier: 3, effectOverride: { action: "DRAW_CARD", cards: 2 } }));
    expect(card.attack).toBe(1000);
    expect(card.defense).toBe(900);
    expect(card.versionTier).toBe(3);
    expect(card.effect).toEqual({ action: "DRAW_CARD", cards: 2 });
  });
});
