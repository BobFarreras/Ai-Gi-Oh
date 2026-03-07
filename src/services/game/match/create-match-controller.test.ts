// src/services/game/match/create-match-controller.test.ts - Verifica la fábrica de match y el ciclo mínimo del controller local desacoplado.
import { describe, expect, it } from "vitest";
import { createMatchController } from "@/services/game/match/create-match-controller";
import { IMatchMode } from "@/core/entities/match";
import { GameState } from "@/core/use-cases/game-engine/state/types";

function createBaseState(): GameState {
  return {
    playerA: {
      id: "p1",
      name: "A",
      healthPoints: 8000,
      maxHealthPoints: 8000,
      currentEnergy: 10,
      maxEnergy: 10,
      deck: [],
      hand: [],
      graveyard: [],
      activeEntities: [],
      activeExecutions: [],
    },
    playerB: {
      id: "p2",
      name: "B",
      healthPoints: 8000,
      maxHealthPoints: 8000,
      currentEnergy: 10,
      maxEnergy: 10,
      deck: [],
      hand: [],
      graveyard: [],
      activeEntities: [],
      activeExecutions: [],
    },
    activePlayerId: "p1",
    startingPlayerId: "p1",
    turn: 1,
    phase: "MAIN_1",
    hasNormalSummonedThisTurn: false,
    pendingTurnAction: null,
    combatLog: [],
  };
}

describe("create-match-controller", () => {
  it.each<IMatchMode>(["TRAINING", "STORY", "TUTORIAL", "MULTIPLAYER"])(
    "crea controller tipado para modo %s",
    async (mode) => {
      const controller = createMatchController({
        mode,
        seed: `seed-${mode}`,
        initialStateFactory: createBaseState,
      });
      const initial = await controller.initialize();
      expect(controller.mode).toBe(mode);
      expect(initial.turn).toBe(1);
    },
  );

  it("inicializa y resetea estado base del match", async () => {
    const controller = createMatchController({
      mode: "TRAINING",
      seed: "seed-1",
      initialStateFactory: createBaseState,
    });
    const initial = await controller.initialize();
    expect(initial.turn).toBe(1);
    const reset = await controller.reset();
    expect(reset.turn).toBe(1);
  });

  it("aplica dispatch usando resolver inyectado", async () => {
    const controller = createMatchController({
      mode: "STORY",
      seed: "seed-2",
      initialStateFactory: createBaseState,
      actionResolver: (state, action) => ({ ...state, turn: action.type === "ADVANCE" ? state.turn + 1 : state.turn }),
    });
    const next = await controller.dispatch({ type: "ADVANCE", actorPlayerId: "p1" });
    expect(next.turn).toBe(2);
  });
});
