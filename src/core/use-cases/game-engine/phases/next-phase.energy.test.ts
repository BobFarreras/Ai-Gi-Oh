// src/core/use-cases/game-engine/phases/next-phase.energy.test.ts - Descripción breve del módulo.
import { describe, expect, it } from "vitest";
import { GameEngine, GameState } from "@/core/use-cases/GameEngine";

function createState(overrides?: Partial<GameState>): GameState {
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
      activeEntities: [],
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
    activePlayerId: "p1",
    startingPlayerId: "p1",
    turn: 2,
    phase: "BATTLE",
    hasNormalSummonedThisTurn: false,
    pendingTurnAction: null,
    combatLog: [],
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

