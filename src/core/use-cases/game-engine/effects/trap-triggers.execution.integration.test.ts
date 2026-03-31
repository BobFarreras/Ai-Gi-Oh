// src/core/use-cases/game-engine/effects/trap-triggers.execution.integration.test.ts - Pruebas de trampas disparadas al activar ejecuciones y efectos derivados.
import { describe, expect, it } from "vitest";
import { GameEngine, GameState } from "@/core/use-cases/GameEngine";
import { createTestBoardEntity } from "@/core/use-cases/game-engine/test-support/state-fixtures";
import {
  createTrapBaseState,
  createTrapEntity,
  executionCard,
  trapCopyOpponentBuff,
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

  it("debería copiar buff rival a todas las entidades del dueño de la trampa", () => {
    const base = createTrapBaseState();
    const buffExecution = {
      id: "exec-buff-defense",
      name: "Buff Defense",
      description: "",
      type: "EXECUTION" as const,
      faction: "OPEN_SOURCE" as const,
      cost: 1,
      effect: { action: "BOOST_DEFENSE_BY_ARCHETYPE" as const, archetype: "TOOL" as const, value: 200 },
    };
    let state: GameState = {
      ...base,
      phase: "MAIN_1",
      playerA: {
        ...base.playerA,
        hand: [buffExecution],
        activeEntities: [createTestBoardEntity("p1-tool", { ...executionCard, id: "entity-tool-a", type: "ENTITY", attack: 900, defense: 600, archetype: "TOOL" }, "ATTACK")],
      },
      playerB: {
        ...base.playerB,
        activeEntities: [createTestBoardEntity("p2-entity", { ...executionCard, id: "entity-guardian", type: "ENTITY", attack: 800, defense: 700 }, "DEFENSE")],
        activeExecutions: [createTrapEntity("t-copy", trapCopyOpponentBuff)],
      },
    };
    state = GameEngine.playCard(state, "p1", "exec-buff-defense", "ACTIVATE");
    const executionId = state.playerA.activeExecutions[0].instanceId;
    const next = GameEngine.resolveExecution(state, "p1", executionId);
    const copiedBuffEntity = next.playerB.activeEntities.find((entity) => entity.instanceId === "p2-entity");
    expect(copiedBuffEntity?.card.defense).toBe(900);
  });
});
