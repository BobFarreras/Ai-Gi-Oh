// src/core/use-cases/game-engine/phases/turn-maintenance.integration.test.ts - Valida reglas de mantenimiento al inicio de turno y reemplazo con campo lleno.
import { describe, expect, it } from "vitest";
import { ICard } from "@/core/entities/ICard";
import { IBoardEntity } from "@/core/entities/IPlayer";
import { GameEngine, GameState } from "@/core/use-cases/GameEngine";

function createCard(id: string, type: "ENTITY" | "EXECUTION" = "ENTITY"): ICard {
  return {
    id,
    name: id,
    description: "Carta de test",
    type,
    faction: "NEUTRAL",
    cost: 1,
    attack: type === "ENTITY" ? 1000 : undefined,
    defense: type === "ENTITY" ? 1000 : undefined,
    effect: type === "EXECUTION" ? { action: "DAMAGE", target: "OPPONENT", value: 300 } : undefined,
  };
}

function createEntity(instanceId: string, cardId: string): IBoardEntity {
  return {
    instanceId,
    card: createCard(cardId),
    mode: "ATTACK",
    hasAttackedThisTurn: false,
    isNewlySummoned: false,
  };
}

function baseState(): GameState {
  return {
    playerA: {
      id: "p1",
      name: "Neo",
      healthPoints: 8000,
      maxHealthPoints: 8000,
      currentEnergy: 10,
      maxEnergy: 10,
      deck: [createCard("p1-deck-1")],
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
      currentEnergy: 10,
      maxEnergy: 10,
      deck: [createCard("p2-deck-1")],
      hand: [],
      graveyard: [],
      activeEntities: [],
      activeExecutions: [],
    },
    activePlayerId: "p2",
    startingPlayerId: "p1",
    turn: 2,
    phase: "BATTLE",
    hasNormalSummonedThisTurn: false,
    pendingTurnAction: null,
    combatLog: [],
  };
}

describe("GameEngine mantenimiento de turno", () => {
  it("debería permitir robar aunque la zona de entidades esté llena", () => {
    const state = {
      ...baseState(),
      playerA: {
        ...baseState().playerA,
        activeEntities: [createEntity("a-1", "a-card-1"), createEntity("a-2", "a-card-2"), createEntity("a-3", "a-card-3")],
      },
    };

    const nextState = GameEngine.nextPhase(state);
    expect(nextState.activePlayerId).toBe("p1");
    expect(nextState.pendingTurnAction).toBeNull();
    expect(nextState.playerA.activeEntities).toHaveLength(3);
    expect(nextState.playerA.hand.some((card) => card.id === "p1-deck-1")).toBe(true);
  });

  it("debería exigir descarte si la mano está en límite antes del robo", () => {
    const hand = [1, 2, 3, 4, 5].map((index) => createCard(`hand-${index}`));
    const state = {
      ...baseState(),
      playerA: { ...baseState().playerA, hand },
    };

    const nextState = GameEngine.nextPhase(state);
    expect(nextState.pendingTurnAction?.type).toBe("DISCARD_FOR_HAND_LIMIT");
    expect(nextState.playerA.hand).toHaveLength(5);
  });

  it("debería descartar una carta y luego robar, manteniendo mano en 5", () => {
    const hand = [1, 2, 3, 4, 5].map((index) => createCard(`hand-${index}`));
    const state = {
      ...baseState(),
      activePlayerId: "p1",
      phase: "MAIN_1" as const,
      pendingTurnAction: { type: "DISCARD_FOR_HAND_LIMIT" as const, playerId: "p1" },
      playerA: { ...baseState().playerA, hand, deck: [createCard("new-draw")] },
    };

    const nextState = GameEngine.resolvePendingTurnAction(state, "p1", "hand-3");
    expect(nextState.pendingTurnAction).toBeNull();
    expect(nextState.playerA.graveyard.some((card) => card.id === "hand-3")).toBe(true);
    expect(nextState.playerA.hand).toHaveLength(5);
    expect(nextState.playerA.hand.some((card) => card.id === "new-draw")).toBe(true);
  });

  it("debería permitir invocar entidad reemplazando una del campo lleno", () => {
    const state = {
      ...baseState(),
      activePlayerId: "p1",
      phase: "MAIN_1" as const,
      playerA: {
        ...baseState().playerA,
        currentEnergy: 8,
        hand: [createCard("new-entity")],
        activeEntities: [createEntity("a-1", "a-card-1"), createEntity("a-2", "a-card-2"), createEntity("a-3", "a-card-3")],
      },
    };

    const nextState = GameEngine.playCardWithEntityReplacement(state, "p1", "new-entity", "ATTACK", "a-2");
    expect(nextState.playerA.activeEntities).toHaveLength(3);
    expect(nextState.playerA.activeEntities.some((entity) => entity.card.id === "new-entity")).toBe(true);
    expect(nextState.playerA.graveyard.some((card) => card.id === "a-card-2")).toBe(true);
    expect(nextState.playerA.hand).toHaveLength(0);
  });
});
