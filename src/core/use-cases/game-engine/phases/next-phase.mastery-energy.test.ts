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

  it("emite ENERGY_GAINED con amount = bonus mastery para disparar el pulse del HUD", () => {
    const next = GameEngine.nextPhase(createState());
    const energyLog = [...next.combatLog].reverse().find((event) => event.eventType === "ENERGY_GAINED");
    expect(energyLog?.actorPlayerId).toBe("p1");
    expect(energyLog?.payload).toMatchObject({ amount: 1 });
  });

  it("emite HEAL_APPLIED (Regeneración) al iniciar el turno del jugador con la pasiva", () => {
    const healState = createTestGameState({
      playerA: createTestPlayer("p1", {
        healthPoints: 7000,
        activeEntities: [
          createTestBoardEntity(
            "h1",
            { id: "entity-postgress", name: "Postgres", description: "", type: "ENTITY", faction: "OPEN_SOURCE", cost: 3, attack: 1000, defense: 1900, versionTier: 5, masteryPassiveSkillId: "passive-heal-200-on-turn" },
            "DEFENSE",
          ),
        ],
      }),
      playerB: createTestPlayer("p2"),
      activePlayerId: "p2",
      startingPlayerId: "p1",
      turn: 2,
      phase: "BATTLE",
    });
    const next = GameEngine.nextPhase(healState);
    const healLog = [...next.combatLog].reverse().find((event) => event.eventType === "HEAL_APPLIED");
    expect(healLog?.actorPlayerId).toBe("p1");
    expect(healLog?.payload).toMatchObject({ amount: 200, source: "MASTERY_PASSIVE_HEAL_ON_TURN" });
  });

  it("emite STAT_BUFF_APPLIED (Aprendizaje Continuo) sobre la entity que crece", () => {
    const growthState = createTestGameState({
      playerA: createTestPlayer("p1", {
        activeEntities: [
          createTestBoardEntity(
            "g1",
            { id: "entity-copilot", name: "Copilot", description: "", type: "ENTITY", faction: "BIG_TECH", cost: 3, attack: 1500, defense: 900, versionTier: 5, masteryPassiveSkillId: "passive-atk-growth-100" },
            "ATTACK",
          ),
        ],
      }),
      playerB: createTestPlayer("p2"),
      activePlayerId: "p2",
      startingPlayerId: "p1",
      turn: 2,
      phase: "BATTLE",
    });
    const next = GameEngine.nextPhase(growthState);
    const buffLog = [...next.combatLog].reverse().find((event) => event.eventType === "STAT_BUFF_APPLIED");
    expect(buffLog?.payload).toMatchObject({ stat: "ATTACK", amount: 100, reason: "MASTERY_PASSIVE_ATK_GROWTH" });
    expect(buffLog?.payload.targetEntityIds).toEqual(["g1"]);
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
