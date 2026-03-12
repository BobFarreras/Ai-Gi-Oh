// src/core/use-cases/game-engine/phases/next-phase.mastery-energy.test.ts - Comprueba bonus de energía por pasiva mastery defensiva al iniciar turno.
import { describe, expect, it } from "vitest";
import { GameEngine, GameState } from "@/core/use-cases/GameEngine";
import { createPhaseBaseState } from "@/core/use-cases/game-engine/phases/phase-state.test-fixtures";

function createState(): GameState {
  const base = createPhaseBaseState();
  return {
    playerA: {
      ...base.playerA,
      currentEnergy: 4,
      activeEntities: [{ instanceId: "a1", card: { id: "entity-python", name: "Python", description: "", type: "ENTITY", faction: "OPEN_SOURCE", cost: 3, attack: 1200, defense: 1200, versionTier: 5, masteryPassiveSkillId: "passive-defense-energy-plus-1" }, mode: "DEFENSE", hasAttackedThisTurn: false, isNewlySummoned: false }],
    },
    playerB: {
      ...base.playerB,
      currentEnergy: 5,
    },
    activePlayerId: "p2",
    startingPlayerId: "p1",
    turn: base.turn,
    phase: base.phase,
    hasNormalSummonedThisTurn: base.hasNormalSummonedThisTurn,
    pendingTurnAction: base.pendingTurnAction,
    combatLog: base.combatLog,
  };
}

describe("next-phase mastery defense bonus", () => {
  it("otorga +3 energía total cuando hay entidad mastery en defensa", () => {
    const next = GameEngine.nextPhase(createState());
    expect(next.activePlayerId).toBe("p1");
    expect(next.playerA.currentEnergy).toBe(7);
  });
});
