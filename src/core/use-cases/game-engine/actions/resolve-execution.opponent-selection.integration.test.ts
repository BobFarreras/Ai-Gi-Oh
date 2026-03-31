// src/core/use-cases/game-engine/actions/resolve-execution.opponent-selection.integration.test.ts - Verifica selección pendiente sobre cartas del rival (SET y cementerio) para ejecuciones especiales.
import { describe, expect, it } from "vitest";
import { ICard } from "@/core/entities/ICard";
import { GameEngine } from "@/core/use-cases/GameEngine";
import { createNeutralEntityCard, createResolveExecutionBaseState } from "@/core/use-cases/game-engine/effects/resolve-execution.test-fixtures";
import { createTestBoardEntity } from "@/core/use-cases/game-engine/test-support/state-fixtures";

describe("resolveExecution opponent selection", () => {
  it("debería crear pending action para revelar carta SET rival y resolverla", () => {
    const revealExecution: ICard = {
      id: "exec-reveal-opponent-set",
      name: "Reveal Set",
      description: "",
      type: "EXECUTION",
      faction: "OPEN_SOURCE",
      cost: 1,
      effect: { action: "REVEAL_OPPONENT_SET_CARD", zone: "ANY" },
    };
    let state = createResolveExecutionBaseState({
      hand: [revealExecution],
    });
    state = {
      ...state,
      playerB: {
        ...state.playerB,
        activeEntities: [createTestBoardEntity("opp-set-entity", createNeutralEntityCard("entity-hidden", 1200, 1200), "SET")],
      },
    };

    state = GameEngine.playCard(state, "p1", "exec-reveal-opponent-set", "ACTIVATE");
    const executionId = state.playerA.activeExecutions.find((entity) => entity.card.id === "exec-reveal-opponent-set")!.instanceId;
    state = GameEngine.resolveExecution(state, "p1", executionId);
    expect(state.pendingTurnAction?.type).toBe("SELECT_OPPONENT_SET_CARD");

    state = GameEngine.resolvePendingTurnAction(state, "p1", "opp-set-entity");
    expect(state.pendingTurnAction).toBeNull();
    expect(state.playerA.graveyard.some((card) => card.id === "exec-reveal-opponent-set")).toBe(true);
  });

  it("debería robar una carta del cementerio rival tras selección pendiente", () => {
    const stealExecution: ICard = {
      id: "exec-steal-opponent-grave",
      name: "Steal Grave",
      description: "",
      type: "EXECUTION",
      faction: "OPEN_SOURCE",
      cost: 1,
      effect: { action: "STEAL_OPPONENT_GRAVEYARD_CARD_TO_HAND", cardType: "ENTITY" },
    };
    let state = createResolveExecutionBaseState({
      hand: [stealExecution],
    });
    state = {
      ...state,
      playerB: {
        ...state.playerB,
        graveyard: [createNeutralEntityCard("grave-entity-target", 1300, 900)],
      },
    };

    state = GameEngine.playCard(state, "p1", "exec-steal-opponent-grave", "ACTIVATE");
    const executionId = state.playerA.activeExecutions.find((entity) => entity.card.id === "exec-steal-opponent-grave")!.instanceId;
    state = GameEngine.resolveExecution(state, "p1", executionId);
    expect(state.pendingTurnAction?.type).toBe("SELECT_OPPONENT_GRAVEYARD_CARD");

    state = GameEngine.resolvePendingTurnAction(state, "p1", "grave-entity-target");
    expect(state.pendingTurnAction).toBeNull();
    expect(state.playerA.hand.some((card) => card.id === "grave-entity-target")).toBe(true);
    expect(state.playerB.graveyard.some((card) => card.id === "grave-entity-target")).toBe(false);
    expect(state.playerA.graveyard.some((card) => card.id === "exec-steal-opponent-grave")).toBe(true);
  });
});
