// src/core/use-cases/game-engine/phases/next-phase.mastery-energy.test.ts - Comprueba bonus de energía por pasiva mastery defensiva al iniciar turno.
import { describe, expect, it } from "vitest";
import { GameEngine, GameState } from "@/core/use-cases/GameEngine";
import {
  createTestBoardEntity,
  createTestGameState,
  createTestPlayer,
} from "@/core/use-cases/game-engine/test-support/state-fixtures";

function createState(): GameState {
  return createTestGameState({
    playerA: createTestPlayer("p1", {
      currentEnergy: 4,
      activeEntities: [
        createTestBoardEntity(
          "a1",
          { id: "entity-python", name: "Python", description: "", type: "ENTITY", faction: "OPEN_SOURCE", cost: 3, attack: 1200, defense: 1200, versionTier: 5, masteryPassiveSkillId: "passive-defense-energy-plus-1" },
          "DEFENSE",
        ),
      ],
    }),
    playerB: createTestPlayer("p2", { currentEnergy: 5 }),
    activePlayerId: "p2",
    startingPlayerId: "p1",
    turn: 2,
    phase: "BATTLE",
  });
}

describe("next-phase mastery defense bonus", () => {
  it("otorga +3 energía total cuando hay entidad mastery en defensa", () => {
    const next = GameEngine.nextPhase(createState());
    expect(next.activePlayerId).toBe("p1");
    expect(next.playerA.currentEnergy).toBe(7);
  });

  it("otorga +3 energía total cuando hay entidad mastery en ataque", () => {
    const attackState = createTestGameState({
      playerA: createTestPlayer("p1", {
        currentEnergy: 4,
        activeEntities: [
          createTestBoardEntity(
            "a1",
            { id: "entity-duckduckgo", name: "Duck", description: "", type: "ENTITY", faction: "NEUTRAL", cost: 2, attack: 1000, defense: 1700, versionTier: 5, masteryPassiveSkillId: "passive-attack-energy-plus-1" },
            "ATTACK",
          ),
        ],
      }),
      playerB: createTestPlayer("p2", { currentEnergy: 5 }),
      activePlayerId: "p2",
      startingPlayerId: "p1",
      turn: 2,
      phase: "BATTLE",
    });
    const next = GameEngine.nextPhase(attackState);
    expect(next.activePlayerId).toBe("p1");
    expect(next.playerA.currentEnergy).toBe(7);
  });
});
