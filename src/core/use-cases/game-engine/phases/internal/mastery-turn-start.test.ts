// src/core/use-cases/game-engine/phases/internal/mastery-turn-start.test.ts - Pruebas de los efectos de pasiva mastery al iniciar el turno (con escalado por versión).
import { describe, expect, it } from "vitest";
import { ICard } from "@/core/entities/ICard";
import { IBoardEntity } from "@/core/entities/IPlayer";
import { MASTERY_PASSIVE_IDS } from "@/core/services/progression/mastery-passive-ids";
import { createTestPlayer } from "@/core/use-cases/game-engine/test-support/state-fixtures";
import { applyMasteryAttackGrowth, applyMasteryTurnStart } from "./mastery-turn-start";

function growthEntity(growth: number | undefined, attack: number, versionTier: number): IBoardEntity {
  const card: ICard = { id: "llm", name: "llm", description: "", type: "ENTITY", faction: "NEUTRAL", cost: 1, attack, defense: 1000, versionTier, masteryPassiveSkillId: MASTERY_PASSIVE_IDS.ATK_GROWTH };
  return { instanceId: "e1", card, mode: "ATTACK", hasAttackedThisTurn: false, isNewlySummoned: false, masteryAttackGrowth: growth };
}

function healEntity(versionTier: number): IBoardEntity {
  const card: ICard = { id: "db", name: "db", description: "", type: "ENTITY", faction: "NEUTRAL", cost: 1, attack: 1000, defense: 1000, versionTier, masteryPassiveSkillId: MASTERY_PASSIVE_IDS.HEAL_ON_TURN };
  return { instanceId: "h1", card, mode: "DEFENSE", hasAttackedThisTurn: false, isNewlySummoned: false };
}

describe("Aprendizaje Continuo (crecimiento de ATK escalado)", () => {
  it("a V5 suma +100 ATK por turno", () => {
    const [grown] = applyMasteryAttackGrowth([growthEntity(undefined, 1000, 5)]);
    expect(grown.card.attack).toBe(1100);
    expect(grown.masteryAttackGrowth).toBe(100);
  });

  it("como pasiva innata (pre-V5) suma solo +50 ATK por turno", () => {
    const [grown] = applyMasteryAttackGrowth([growthEntity(undefined, 1000, 1)]);
    expect(grown.card.attack).toBe(1050);
    expect(grown.masteryAttackGrowth).toBe(50);
  });

  it("respeta el tope acumulado de V5 (+500)", () => {
    const [grown] = applyMasteryAttackGrowth([growthEntity(500, 1500, 5)]);
    expect(grown.card.attack).toBe(1500);
    expect(grown.masteryAttackGrowth).toBe(500);
  });
});

describe("Regeneración (curación escalada)", () => {
  it("a V5 cura 200 HP", () => {
    const player = createTestPlayer("p1", { healthPoints: 7000, activeEntities: [healEntity(5)] });
    expect(applyMasteryTurnStart(player).healthPoints).toBe(7200);
  });

  it("como pasiva innata (pre-V5) cura 100 HP", () => {
    const player = createTestPlayer("p1", { healthPoints: 7000, activeEntities: [healEntity(1)] });
    expect(applyMasteryTurnStart(player).healthPoints).toBe(7100);
  });

  it("no supera el HP máximo", () => {
    const player = createTestPlayer("p1", { healthPoints: 7950, activeEntities: [healEntity(5)] });
    expect(applyMasteryTurnStart(player).healthPoints).toBe(8000);
  });

  it("no cura si no hay entity con la pasiva", () => {
    const player = createTestPlayer("p1", { healthPoints: 7000 });
    expect(applyMasteryTurnStart(player).healthPoints).toBe(7000);
  });
});
