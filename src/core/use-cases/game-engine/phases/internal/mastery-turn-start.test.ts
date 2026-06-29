// src/core/use-cases/game-engine/phases/internal/mastery-turn-start.test.ts - Pruebas de los efectos de pasiva mastery al iniciar el turno.
import { describe, expect, it } from "vitest";
import { ICard } from "@/core/entities/ICard";
import { IBoardEntity } from "@/core/entities/IPlayer";
import { MASTERY_PASSIVE_IDS } from "@/core/services/progression/mastery-passive-ids";
import { createTestPlayer } from "@/core/use-cases/game-engine/test-support/state-fixtures";
import { applyMasteryAttackGrowth, applyMasteryTurnStart } from "./mastery-turn-start";

function growthEntity(growth: number | undefined, attack: number): IBoardEntity {
  const card: ICard = { id: "llm", name: "llm", description: "", type: "ENTITY", faction: "NEUTRAL", cost: 1, attack, defense: 1000, masteryPassiveSkillId: MASTERY_PASSIVE_IDS.ATK_GROWTH };
  return { instanceId: "e1", card, mode: "ATTACK", hasAttackedThisTurn: false, isNewlySummoned: false, masteryAttackGrowth: growth };
}

function healEntity(): IBoardEntity {
  const card: ICard = { id: "db", name: "db", description: "", type: "ENTITY", faction: "NEUTRAL", cost: 1, attack: 1000, defense: 1000, masteryPassiveSkillId: MASTERY_PASSIVE_IDS.HEAL_ON_TURN };
  return { instanceId: "h1", card, mode: "DEFENSE", hasAttackedThisTurn: false, isNewlySummoned: false };
}

describe("Aprendizaje Continuo (crecimiento de ATK)", () => {
  it("suma +100 ATK y registra el crecimiento acumulado", () => {
    const [grown] = applyMasteryAttackGrowth([growthEntity(undefined, 1000)]);
    expect(grown.card.attack).toBe(1100);
    expect(grown.masteryAttackGrowth).toBe(100);
  });

  it("no crece más allá del tope de +500 acumulado", () => {
    const [grown] = applyMasteryAttackGrowth([growthEntity(500, 1500)]);
    expect(grown.card.attack).toBe(1500);
    expect(grown.masteryAttackGrowth).toBe(500);
  });
});

describe("Regeneración (curación de inicio de turno)", () => {
  it("cura 200 HP cuando hay una entity con la pasiva", () => {
    const player = createTestPlayer("p1", { healthPoints: 7000, activeEntities: [healEntity()] });
    expect(applyMasteryTurnStart(player).healthPoints).toBe(7200);
  });

  it("no supera el HP máximo", () => {
    const player = createTestPlayer("p1", { healthPoints: 7900, activeEntities: [healEntity()] });
    expect(applyMasteryTurnStart(player).healthPoints).toBe(8000);
  });

  it("no cura si no hay entity con la pasiva", () => {
    const player = createTestPlayer("p1", { healthPoints: 7000 });
    expect(applyMasteryTurnStart(player).healthPoints).toBe(7000);
  });
});
