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

function createEntity(instanceId: string, attack: number, defense: number, mode: "ATTACK" | "DEFENSE" | "SET" = "ATTACK") {
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
    mode,
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

  it("mantiene presión atacando objetivos SET cuando no es un suicidio claro", () => {
    const opponent = createPlayer("p2");
    const target = createPlayer("p1");
    opponent.activeEntities = [createEntity("p2-prober", 2100, 1300)];
    target.activeEntities = [createEntity("p1-hidden", 1200, 1800, "SET")];

    const decision = chooseBestAttack(opponent, target, getDifficultyProfile("MYTHIC"));
    expect(decision).not.toBeNull();
    expect(decision?.defenderInstanceId).toBe("p1-hidden");
  });

  it("evita presión contra SET si el intercambio sería suicida total", () => {
    const opponent = createPlayer("p2");
    const target = createPlayer("p1");
    opponent.activeEntities = [createEntity("p2-weak", 1200, 900)];
    target.activeEntities = [createEntity("p1-hidden-tank", 500, 4200, "SET")];

    const decision = chooseBestAttack(opponent, target, getDifficultyProfile("MYTHIC"));
    expect(decision).toBeNull();
  });

  it("no ataca una DEFENSE visible si solo perdería LP y no rompe defensa", () => {
    const opponent = createPlayer("p2");
    const target = createPlayer("p1");
    opponent.activeEntities = [createEntity("p2-front", 1500, 900)];
    target.activeEntities = [createEntity("p1-wall-defense", 1900, 1900, "DEFENSE")];

    const decision = chooseBestAttack(opponent, target, getDifficultyProfile("EASY"));
    expect(decision).toBeNull();
  });
});

