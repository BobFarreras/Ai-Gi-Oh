// src/core/services/opponent/attackEvaluator.test.ts - Descripción breve del módulo.
import { describe, expect, it } from "vitest";
import { IPlayer } from "@/core/entities/IPlayer";
import { getDifficultyProfile } from "./difficulty/difficultyProfiles";
import { chooseBestAttack } from "./attackEvaluator";

function createPlayer(id: string): IPlayer {
  return {
    id,
    name: id,
    healthPoints: 8000,
    maxHealthPoints: 8000,
    currentEnergy: 10,
    maxEnergy: 10,
    deck: [],
    hand: [],
    graveyard: [],
    activeEntities: [],
    activeExecutions: [],
  };
}

function createEntity(instanceId: string, attack: number, defense: number) {
  return {
    instanceId,
    card: {
      id: `${instanceId}-card`,
      name: instanceId,
      description: "Entidad de prueba",
      type: "ENTITY" as const,
      faction: "OPEN_SOURCE" as const,
      cost: 3,
      attack,
      defense,
    },
    mode: "ATTACK" as const,
    hasAttackedThisTurn: false,
    isNewlySummoned: false,
  };
}

describe("attackEvaluator", () => {
  it("evita ataque suicida en HARD", () => {
    const opponent = createPlayer("p2");
    const target = createPlayer("p1");
    opponent.activeEntities = [createEntity("p2-probe", 1000, 700)];
    target.activeEntities = [createEntity("p1-wall", 3000, 2600)];

    const decision = chooseBestAttack(opponent, target, getDifficultyProfile("HARD"));
    expect(decision).toBeNull();
  });

  it("permite lethal aunque exista riesgo", () => {
    const opponent = createPlayer("p2");
    const target = createPlayer("p1");
    target.healthPoints = 1200;
    opponent.activeEntities = [createEntity("p2-finisher", 1500, 900)];

    const decision = chooseBestAttack(opponent, target, getDifficultyProfile("HARD"));
    expect(decision).not.toBeNull();
    expect(decision?.defenderInstanceId).toBeUndefined();
  });

  it("permite limpiar amenaza crítica aunque el trade sea duro", () => {
    const opponent = createPlayer("p2");
    const target = createPlayer("p1");
    opponent.activeEntities = [createEntity("p2-clearer", 3100, 100)];
    target.activeEntities = [createEntity("p1-threat", 3000, 3000)];

    const decision = chooseBestAttack(opponent, target, getDifficultyProfile("HARD"));
    expect(decision).not.toBeNull();
    expect(decision?.defenderInstanceId).toBe("p1-threat");
  });
});

