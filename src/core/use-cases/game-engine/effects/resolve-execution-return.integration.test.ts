// src/core/use-cases/game-engine/effects/resolve-execution-return.integration.test.ts - Valida retornos desde cementerio a mano/campo y overflow hacia destroyedPile.
import { describe, expect, it } from "vitest";
import { ICard } from "@/core/entities/ICard";
import { GameEngine } from "@/core/use-cases/GameEngine";
import {
  createExecutionEntity,
  createNeutralEntityCard,
  createResolveExecutionBaseState,
} from "@/core/use-cases/game-engine/effects/resolve-execution.test-fixtures";

describe("resolveExecution return effects", () => {
  it("devuelve del cementerio a mano y destruye una carta si la mano está llena", () => {
    const effectCard: ICard = {
      id: "exec-return-hand",
      name: "Return Hand",
      description: "",
      type: "EXECUTION",
      faction: "NEUTRAL",
      cost: 2,
      effect: { action: "RETURN_GRAVEYARD_CARD_TO_HAND", cardType: "ENTITY" },
    };
    const extraHandCards = ["h1", "h2", "h3", "h4", "h5"].map((id) => ({
      id,
      name: id,
      description: "",
      type: "ENTITY" as const,
      faction: "NEUTRAL" as const,
      cost: 1,
      attack: 500,
      defense: 500,
    }));
    let state = createResolveExecutionBaseState({
      hand: [effectCard],
    });
    state = { ...state, playerA: { ...state.playerA, hand: [effectCard, ...extraHandCards], graveyard: [{ ...extraHandCards[0], id: "grave-entity" }] } };
    state = GameEngine.playCard(state, "p1", "exec-return-hand", "ACTIVATE");
    const executionId = state.playerA.activeExecutions[0].instanceId;
    const withPending = GameEngine.resolveExecution(state, "p1", executionId);
    expect(withPending.pendingTurnAction?.type).toBe("SELECT_GRAVEYARD_CARD");
    const next = GameEngine.resolvePendingTurnAction(withPending, "p1", "grave-entity");
    expect(next.playerA.hand.some((card) => card.id === "grave-entity")).toBe(true);
    expect((next.playerA.destroyedPile ?? []).length).toBe(1);
    expect(next.combatLog.some((event) => event.eventType === "CARD_TO_DESTROYED")).toBe(true);
  });

  it("devuelve entidad al campo y destruye una existente si la zona está llena", () => {
    const effectCard: ICard = {
      id: "exec-return-field",
      name: "Return Field",
      description: "",
      type: "EXECUTION",
      faction: "NEUTRAL",
      cost: 2,
      effect: { action: "RETURN_GRAVEYARD_CARD_TO_FIELD", cardType: "ENTITY" },
    };
    let state = createResolveExecutionBaseState({
      hand: [effectCard],
    });
    state = {
      ...state,
      playerA: {
        ...state.playerA,
        activeEntities: [
          createExecutionEntity("e1", createNeutralEntityCard("field-1", 900), "SET"),
          createExecutionEntity("e2", createNeutralEntityCard("field-2", 950), "SET"),
          createExecutionEntity("e3", createNeutralEntityCard("field-3", 980), "SET"),
        ],
        graveyard: [createNeutralEntityCard("grave-target", 1300, 1000)],
      },
    };
    state = GameEngine.playCard(state, "p1", "exec-return-field", "ACTIVATE");
    const executionId = state.playerA.activeExecutions[0].instanceId;
    const withPending = GameEngine.resolveExecution(state, "p1", executionId);
    expect(withPending.pendingTurnAction?.type).toBe("SELECT_GRAVEYARD_CARD");
    const next = GameEngine.resolvePendingTurnAction(withPending, "p1", "grave-target");
    expect(next.playerA.activeEntities.some((entity) => entity.card.id === "grave-target")).toBe(true);
    expect((next.playerA.destroyedPile ?? []).some((card) => card.id === "field-1")).toBe(true);
  });
});
