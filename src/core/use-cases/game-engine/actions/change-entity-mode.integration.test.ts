// src/core/use-cases/game-engine/actions/change-entity-mode.integration.test.ts - Prueba de cambio de modo para entidades y ejecuciones del jugador activo.
import { describe, expect, it } from "vitest";
import { GameEngine } from "@/core/use-cases/GameEngine";
import {
  createActionBaseState,
  spellCard,
} from "@/core/use-cases/game-engine/actions/play-and-execution.test-fixtures";

describe("GameEngine change entity mode", () => {
  it("debería cambiar modo en entidades y ejecuciones", () => {
    let state = createActionBaseState();
    state = GameEngine.playCard(state, "p1", "entity-1", "ATTACK");
    state = GameEngine.playCard(
      {
        ...state,
        hasNormalSummonedThisTurn: true,
        playerA: { ...state.playerA, hand: [spellCard] },
      },
      "p1",
      "spell-1",
      "SET",
    );

    const entityId = state.playerA.activeEntities[0].instanceId;
    const executionId = state.playerA.activeExecutions[0].instanceId;

    state = GameEngine.changeEntityMode(state, "p1", entityId, "DEFENSE");
    state = GameEngine.changeEntityMode(state, "p1", executionId, "ACTIVATE");

    expect(state.playerA.activeEntities[0].mode).toBe("DEFENSE");
    expect(state.playerA.activeExecutions[0].mode).toBe("ACTIVATE");
  });
});
