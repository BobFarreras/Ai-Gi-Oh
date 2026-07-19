// src/core/use-cases/game-engine/phases/next-phase.first-turn-energy.test.ts - Verifica "Arranque en Frío"
// (ficha 8): energía one-time en el primer turno del jugador, POR ENCIMA del tope, y limpiada tras concederla.
import { describe, expect, it } from "vitest";
import { GameEngine, GameState } from "@/core/use-cases/GameEngine";
import { createTestGameState, createTestPlayer } from "@/core/use-cases/game-engine/test-support/state-fixtures";

function stateWithFirstTurnBonus(): GameState {
  const state = createTestGameState({
    playerA: createTestPlayer("p1", { currentEnergy: 10 }),
    playerB: createTestPlayer("p2", { currentEnergy: 5 }),
    activePlayerId: "p2",
    startingPlayerId: "p2",
    turn: 1,
    phase: "BATTLE",
  });
  state.firstTurnEnergyBonusByPlayerId = { p1: 1 };
  return state;
}

describe("next-phase Arranque en Frío (first-turn energy)", () => {
  it("concede la energía extra al arrancar el primer turno del jugador, superando el tope", () => {
    const next = GameEngine.nextPhase(stateWithFirstTurnBonus());
    expect(next.activePlayerId).toBe("p1");
    // p1 estaba a tope (10); la ganancia normal clampa a 10 y Arranque suma +1 por encima → 11.
    expect(next.playerA.currentEnergy).toBe(11);
  });

  it("limpia el bonus tras concederlo (no se repite en turnos posteriores)", () => {
    const next = GameEngine.nextPhase(stateWithFirstTurnBonus());
    expect(next.firstTurnEnergyBonusByPlayerId?.p1).toBe(0);
  });

  it("sin bonus, la energía sigue la ganancia normal clampada al tope", () => {
    const state = createTestGameState({
      playerA: createTestPlayer("p1", { currentEnergy: 10 }),
      playerB: createTestPlayer("p2", { currentEnergy: 5 }),
      activePlayerId: "p2",
      startingPlayerId: "p2",
      turn: 1,
      phase: "BATTLE",
    });
    const next = GameEngine.nextPhase(state);
    expect(next.playerA.currentEnergy).toBe(10);
  });
});
