// src/core/use-cases/game-engine/effects/resolve-execution-return.integration.test.ts - Valida retornos desde cementerio a mano/campo y overflow hacia destroyedPile.
import { describe, expect, it } from "vitest";
import { ICard } from "@/core/entities/ICard";
import { IBoardEntity } from "@/core/entities/IPlayer";
import { GameEngine, GameState } from "@/core/use-cases/GameEngine";

function createEntity(instanceId: string, cardId: string, attack = 1000): IBoardEntity {
  return {
    instanceId,
    card: { id: cardId, name: cardId, description: "", type: "ENTITY", faction: "NEUTRAL", cost: 2, attack, defense: 900 },
    mode: "ATTACK",
    hasAttackedThisTurn: false,
    isNewlySummoned: false,
  };
}

function createState(executionCard: ICard): GameState {
  return {
    playerA: {
      id: "p1",
      name: "Neo",
      healthPoints: 8000,
      maxHealthPoints: 8000,
      currentEnergy: 10,
      maxEnergy: 10,
      deck: [],
      hand: [executionCard],
      graveyard: [],
      destroyedPile: [],
      activeEntities: [],
      activeExecutions: [],
    },
    playerB: {
      id: "p2",
      name: "Smith",
      healthPoints: 8000,
      maxHealthPoints: 8000,
      currentEnergy: 10,
      maxEnergy: 10,
      deck: [],
      hand: [],
      graveyard: [],
      destroyedPile: [],
      activeEntities: [],
      activeExecutions: [],
    },
    activePlayerId: "p1",
    startingPlayerId: "p2",
    turn: 2,
    phase: "MAIN_1",
    hasNormalSummonedThisTurn: false,
    pendingTurnAction: null,
    combatLog: [],
  };
}

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
    let state = createState(effectCard);
    state = { ...state, playerA: { ...state.playerA, hand: [effectCard, ...extraHandCards], graveyard: [{ ...extraHandCards[0], id: "grave-entity" }] } };
    state = GameEngine.playCard(state, "p1", "exec-return-hand", "ACTIVATE");
    const executionId = state.playerA.activeExecutions[0].instanceId;
    const next = GameEngine.resolveExecution(state, "p1", executionId);
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
    let state = createState(effectCard);
    state = {
      ...state,
      playerA: {
        ...state.playerA,
        activeEntities: [createEntity("e1", "field-1", 900), createEntity("e2", "field-2", 950), createEntity("e3", "field-3", 980)],
        graveyard: [{ id: "grave-target", name: "grave-target", description: "", type: "ENTITY", faction: "NEUTRAL", cost: 2, attack: 1300, defense: 1000 }],
      },
    };
    state = GameEngine.playCard(state, "p1", "exec-return-field", "ACTIVATE");
    const executionId = state.playerA.activeExecutions[0].instanceId;
    const next = GameEngine.resolveExecution(state, "p1", executionId);
    expect(next.playerA.activeEntities.some((entity) => entity.card.id === "grave-target")).toBe(true);
    expect((next.playerA.destroyedPile ?? []).some((card) => card.id === "field-1")).toBe(true);
  });
});
