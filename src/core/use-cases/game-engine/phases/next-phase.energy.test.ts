// src/core/use-cases/game-engine/phases/next-phase.energy.test.ts - Pruebas de ganancia de energía y cambio de jugador al avanzar de fase.
import { describe, expect, it } from "vitest";
import { GameEngine, GameState } from "@/core/use-cases/GameEngine";
import { createPhaseBaseState } from "@/core/use-cases/game-engine/phases/phase-state.test-fixtures";

function createState(overrides?: Partial<GameState>): GameState {
  const base = createPhaseBaseState();
  return {
    ...base,
    playerA: { ...base.playerA, currentEnergy: 4, deck: [] },
    playerB: { ...base.playerB, currentEnergy: 5, deck: [] },
    activePlayerId: "p1",
    startingPlayerId: "p1",
    ...overrides,
  };
}

describe("Regla de energía por turno", () => {
  it("debería ganar +2 de energía al entrar el turno propio", () => {
    const next = GameEngine.nextPhase(createState());
    expect(next.activePlayerId).toBe("p2");
    expect(next.playerB.currentEnergy).toBe(7);
  });

  it("no debería superar maxEnergy", () => {
    const next = GameEngine.nextPhase(
      createState({
        playerB: { ...createState().playerB, currentEnergy: 9 },
      }),
    );
    expect(next.playerB.currentEnergy).toBe(10);
  });

  it("debería acumular correctamente en turnos consecutivos", () => {
    let state = createState();
    state = GameEngine.nextPhase(state);
    state = { ...state, phase: "BATTLE" };
    state = GameEngine.nextPhase(state);
    expect(state.playerA.currentEnergy).toBe(6);
  });
});

