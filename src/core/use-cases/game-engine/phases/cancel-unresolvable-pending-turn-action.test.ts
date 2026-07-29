// src/core/use-cases/game-engine/phases/cancel-unresolvable-pending-turn-action.test.ts - Verifica recuperación segura de selecciones automáticas imposibles.
import { describe, expect, it } from "vitest";
import { GameEngine } from "@/core/use-cases/GameEngine";
import {
  createTestBoardEntity,
  createTestGameState,
  createTestPlayer,
} from "@/core/use-cases/game-engine/test-support/state-fixtures";

const FUSION_EXECUTION = {
  id: "exec-fusion",
  name: "Fusión",
  description: "Fusiona",
  type: "EXECUTION" as const,
  faction: "NEUTRAL" as const,
  cost: 2,
  effect: { action: "FUSION_SUMMON" as const, recipeId: "fusion-missing", materialsRequired: 2 },
};

describe("cancelUnresolvablePendingTurnAction", () => {
  it("devuelve a SET una ejecución de fusión que perdió sus materiales", () => {
    const state = createTestGameState({
      playerA: createTestPlayer("p1"),
      playerB: createTestPlayer("p2", {
        activeExecutions: [createTestBoardEntity("exec-1", FUSION_EXECUTION, "ACTIVATE")],
      }),
      activePlayerId: "p2",
      pendingTurnAction: {
        type: "SELECT_FUSION_MATERIALS",
        playerId: "p2",
        fusionFromExecutionInstanceId: "exec-1",
        fusionFromExecutionRecipeId: "fusion-missing",
        mode: "ATTACK",
        selectedMaterialInstanceIds: [],
      },
    });

    const recovered = GameEngine.cancelUnresolvablePendingTurnAction(state, "p2");

    expect(recovered.pendingTurnAction).toBeNull();
    expect(recovered.playerB.activeExecutions[0].mode).toBe("SET");
    expect(recovered.playerB.graveyard).toHaveLength(0);
    expect(recovered.combatLog.at(-1)?.payload.resolution).toBe("AUTO_CANCELLED_NO_CANDIDATES");
  });

  it("consume una ejecución ordinaria cuando su objetivo dejó de existir", () => {
    const execution = { ...FUSION_EXECUTION, id: "exec-lock", effect: { action: "LOCK_OPPONENT_ENTITY" as const, turns: 1 } };
    const state = createTestGameState({
      playerA: createTestPlayer("p1"),
      playerB: createTestPlayer("p2", {
        activeExecutions: [createTestBoardEntity("exec-1", execution, "ACTIVATE")],
      }),
      activePlayerId: "p2",
      pendingTurnAction: {
        type: "SELECT_OPPONENT_ENTITY_TO_LOCK",
        playerId: "p2",
        executionInstanceId: "exec-1",
        turns: 1,
      },
    });

    const recovered = GameEngine.cancelUnresolvablePendingTurnAction(state, "p2");

    expect(recovered.pendingTurnAction).toBeNull();
    expect(recovered.playerB.activeExecutions).toHaveLength(0);
    expect(recovered.playerB.graveyard).toEqual([execution]);
  });
});
