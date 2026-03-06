// src/core/use-cases/game-engine/phases/next-phase.mastery-energy.test.ts - Comprueba bonus de energía por pasiva mastery defensiva al iniciar turno.
import { describe, expect, it } from "vitest";
import { GameEngine, GameState } from "@/core/use-cases/GameEngine";

function createState(): GameState {
  return {
    playerA: {
      id: "p1",
      name: "Neo",
      healthPoints: 8000,
      maxHealthPoints: 8000,
      currentEnergy: 4,
      maxEnergy: 10,
      deck: [],
      hand: [],
      graveyard: [],
      activeEntities: [{ instanceId: "a1", card: { id: "entity-python", name: "Python", description: "", type: "ENTITY", faction: "OPEN_SOURCE", cost: 3, attack: 1200, defense: 1200, versionTier: 5, masteryPassiveSkillId: "passive-defense-energy-plus-1" }, mode: "DEFENSE", hasAttackedThisTurn: false, isNewlySummoned: false }],
      activeExecutions: [],
    },
    playerB: {
      id: "p2",
      name: "Smith",
      healthPoints: 8000,
      maxHealthPoints: 8000,
      currentEnergy: 5,
      maxEnergy: 10,
      deck: [],
      hand: [],
      graveyard: [],
      activeEntities: [],
      activeExecutions: [],
    },
    activePlayerId: "p2",
    startingPlayerId: "p1",
    turn: 2,
    phase: "BATTLE",
    hasNormalSummonedThisTurn: false,
    pendingTurnAction: null,
    combatLog: [],
  };
}

describe("next-phase mastery defense bonus", () => {
  it("otorga +3 energía total cuando hay entidad mastery en defensa", () => {
    const next = GameEngine.nextPhase(createState());
    expect(next.activePlayerId).toBe("p1");
    expect(next.playerA.currentEnergy).toBe(7);
  });
});
