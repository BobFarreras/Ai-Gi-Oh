// src/core/use-cases/game-engine/effects/trap-triggers.execution.integration.test.ts - Pruebas de trampas disparadas al activar ejecuciones y efectos derivados.
import { describe, expect, it } from "vitest";
import { GameEngine, GameState } from "@/core/use-cases/GameEngine";
import { createTestBoardEntity } from "@/core/use-cases/game-engine/test-support/state-fixtures";
import {
  createTrapBaseState,
  createTrapEntity,
  executionCard,
  trapOnExecution,
  trapReduceDefenseOnExecution,
} from "@/core/use-cases/game-engine/effects/trap-triggers.test-fixtures";

describe("Trap triggers on execution", () => {
  it("debería disparar trampa cuando el rival activa una ejecución", () => {
    const base = createTrapBaseState();
    let state: GameState = {
      ...base,
      phase: "MAIN_1",
      playerA: {
        ...base.playerA,
        hand: [executionCard],
      },
      playerB: {
        ...base.playerB,
        activeExecutions: [createTrapEntity("t2", trapOnExecution)],
      },
    };

    state = GameEngine.playCard(state, "p1", "exec-card", "ACTIVATE");
    const executionId = state.playerA.activeExecutions[0].instanceId;
    const next = GameEngine.resolveExecution(state, "p1", executionId);

    expect(next.playerA.healthPoints).toBe(7600);
    expect(next.playerB.activeExecutions).toHaveLength(0);
    expect(next.playerB.graveyard.some((card) => card.id === "trap-on-execution")).toBe(true);
    expect(next.playerB.healthPoints).toBe(7400);
  });

  it("debería reducir DEF de entidades rivales al activar ejecución", () => {
    const base = createTrapBaseState();
    let state: GameState = {
      ...base,
      phase: "MAIN_1",
      playerA: {
        ...base.playerA,
        hand: [executionCard],
        activeEntities: [
          createTestBoardEntity(
            "p1-defender",
            {
              id: "p1-defender-card",
              name: "Defender",
              description: "",
              type: "ENTITY",
              faction: "OPEN_SOURCE",
              cost: 2,
              attack: 1000,
              defense: 1400,
            },
            "DEFENSE",
          ),
        ],
      },
      playerB: {
        ...base.playerB,
        activeExecutions: [createTrapEntity("t-def", trapReduceDefenseOnExecution)],
      },
    };

    state = GameEngine.playCard(state, "p1", "exec-card", "ACTIVATE");
    const executionId = state.playerA.activeExecutions[0].instanceId;
    const next = GameEngine.resolveExecution(state, "p1", executionId);

    const defender = next.playerA.activeEntities.find((entity) => entity.instanceId === "p1-defender");
    expect(defender?.card.defense).toBe(1100);
  });
});
