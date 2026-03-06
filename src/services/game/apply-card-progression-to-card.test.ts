// src/services/game/apply-card-progression-to-card.test.ts - Verifica bonus de nivel aplicados a cartas para estado de combate.
import { describe, expect, it } from "vitest";
import { ICard } from "@/core/entities/ICard";
import { IPlayerCardProgress } from "@/core/entities/progression/IPlayerCardProgress";
import { applyCardProgressionToCard } from "./apply-card-progression-to-card";

const ENTITY_CARD: ICard = {
  id: "entity-test",
  name: "Entity Test",
  description: "Carta de prueba",
  type: "ENTITY",
  faction: "OPEN_SOURCE",
  cost: 4,
  attack: 1000,
  defense: 900,
};

const EXEC_CARD: ICard = {
  id: "exec-test",
  name: "Exec Test",
  description: "Carta de ejecución",
  type: "EXECUTION",
  faction: "OPEN_SOURCE",
  cost: 2,
  effect: { action: "DRAW_CARD", cards: 1 },
};

function createProgress(level: number): IPlayerCardProgress {
  return {
    playerId: "p1",
    cardId: "any",
    versionTier: 0,
    level,
    xp: 0,
    masteryPassiveSkillId: null,
    updatedAtIso: new Date().toISOString(),
  };
}

describe("apply-card-progression-to-card", () => {
  it("aplica bonus ATK/DEF a ENTITY y reducción de coste en nivel 30", () => {
    const atLevel20 = applyCardProgressionToCard(ENTITY_CARD, createProgress(20));
    expect(atLevel20.attack).toBe(1300);
    expect(atLevel20.defense).toBe(1200);
    expect(atLevel20.cost).toBe(4);

    const atLevel30 = applyCardProgressionToCard(ENTITY_CARD, createProgress(30));
    expect(atLevel30.cost).toBe(3);
  });

  it("en EXECUTION solo reduce coste al nivel 30", () => {
    const atLevel20 = applyCardProgressionToCard(EXEC_CARD, createProgress(20));
    expect(atLevel20.cost).toBe(2);
    const atLevel30 = applyCardProgressionToCard(EXEC_CARD, createProgress(30));
    expect(atLevel30.cost).toBe(1);
    expect(atLevel30.attack).toBeUndefined();
    expect(atLevel30.defense).toBeUndefined();
  });
});

