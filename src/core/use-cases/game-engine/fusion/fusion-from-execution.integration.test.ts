// src/core/use-cases/game-engine/fusion/fusion-from-execution.integration.test.ts - Verifica el flujo de fusión activada desde ejecución y sus efectos en tablero/log.
import { describe, expect, it } from "vitest";
import { GameEngine, GameState } from "@/core/use-cases/GameEngine";
import {
  createFusionExecutionCard,
  createFusionMaterialEntity,
} from "@/core/use-cases/game-engine/fusion/fusion-test-fixtures";
import {
  createTestGameState,
  createTestPlayer,
} from "@/core/use-cases/game-engine/test-support/state-fixtures";

describe("fusión desde ejecución", () => {
  it("debería iniciar selección y completar fusión al elegir 2 materiales", () => {
    let state = GameEngine.playCard(
      createTestGameState({
        playerA: createTestPlayer("p1", {
          name: "Neo",
          hand: [createFusionExecutionCard()],
          activeEntities: [
            createFusionMaterialEntity("m1", "entity-chatgpt", "BIG_TECH"),
            createFusionMaterialEntity("m2", "entity-gemini", "BIG_TECH"),
          ],
        }),
        playerB: createTestPlayer("p2", { name: "Smith" }),
        activePlayerId: "p1",
        startingPlayerId: "p1",
        turn: 2,
        phase: "MAIN_1",
      }),
      "p1",
      "exec-fusion-gemgpt",
      "ACTIVATE",
    );
    const executionInstanceId = state.playerA.activeExecutions[0].instanceId;
    state = GameEngine.resolveExecution(state, "p1", executionInstanceId);
    expect(state.pendingTurnAction?.type).toBe("SELECT_FUSION_MATERIALS");
    expect(state.playerA.activeExecutions.some((entity) => entity.instanceId === executionInstanceId)).toBe(true);

    state = GameEngine.resolvePendingTurnAction(state, "p1", "m1");
    state = GameEngine.resolvePendingTurnAction(state, "p1", "m2");

    expect(state.pendingTurnAction).toBeNull();
    expect(state.playerA.activeEntities.some((entity) => entity.card.id === "fusion-gemgpt")).toBe(true);
    expect(state.playerA.graveyard.map((card) => card.id)).toEqual(
      expect.arrayContaining(["entity-chatgpt", "entity-gemini", "exec-fusion-gemgpt"]),
    );
  });

  it("si faltan materiales debe quedar en espera sin bloquear el flujo", () => {
    const base = createTestGameState({
      playerA: createTestPlayer("p1", {
        name: "Neo",
        hand: [createFusionExecutionCard()],
        activeEntities: [
          createFusionMaterialEntity("m1", "entity-chatgpt", "BIG_TECH"),
          createFusionMaterialEntity("m2", "entity-gemini", "BIG_TECH"),
        ],
      }),
      playerB: createTestPlayer("p2", { name: "Smith" }),
      activePlayerId: "p1",
      startingPlayerId: "p1",
      turn: 2,
      phase: "MAIN_1",
    });
    const stateWithOneMaterial: GameState = {
      ...base,
      playerA: {
        ...base.playerA,
        activeEntities: [base.playerA.activeEntities[0]],
      },
    };

    let state = GameEngine.playCard(stateWithOneMaterial, "p1", "exec-fusion-gemgpt", "ACTIVATE");
    const executionInstanceId = state.playerA.activeExecutions[0].instanceId;
    state = GameEngine.resolveExecution(state, "p1", executionInstanceId);

    expect(state.pendingTurnAction).toBeNull();
    expect(state.playerA.activeExecutions).toHaveLength(1);
    expect(state.playerA.activeExecutions[0].mode).toBe("SET");
    expect(state.playerA.graveyard.some((card) => card.id === "exec-fusion-gemgpt")).toBe(false);
  });
});

