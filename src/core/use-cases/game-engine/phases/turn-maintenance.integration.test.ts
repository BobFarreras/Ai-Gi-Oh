// src/core/use-cases/game-engine/phases/turn-maintenance.integration.test.ts - Valida reglas de mantenimiento al inicio de turno y reemplazo con campo lleno.
import { describe, expect, it } from "vitest";
import { GameEngine } from "@/core/use-cases/GameEngine";
import { createPhaseBaseState, createPhaseCard, createPhaseEntity } from "@/core/use-cases/game-engine/phases/phase-state.test-fixtures";

describe("GameEngine mantenimiento de turno", () => {
  it("debería permitir robar aunque la zona de entidades esté llena", () => {
    const state = {
      ...createPhaseBaseState(),
      playerA: {
        ...createPhaseBaseState().playerA,
        activeEntities: [createPhaseEntity("a-1", "a-card-1"), createPhaseEntity("a-2", "a-card-2"), createPhaseEntity("a-3", "a-card-3")],
      },
    };

    const nextState = GameEngine.nextPhase(state);
    expect(nextState.activePlayerId).toBe("p1");
    expect(nextState.pendingTurnAction).toBeNull();
    expect(nextState.playerA.activeEntities).toHaveLength(3);
    expect(nextState.playerA.hand.some((card) => card.id === "p1-deck-1")).toBe(true);
  });

  it("debería exigir descarte si la mano está en límite antes del robo", () => {
    const hand = [1, 2, 3, 4, 5].map((index) => createPhaseCard(`hand-${index}`));
    const state = {
      ...createPhaseBaseState(),
      playerA: { ...createPhaseBaseState().playerA, hand },
    };

    const nextState = GameEngine.nextPhase(state);
    expect(nextState.pendingTurnAction?.type).toBe("DISCARD_FOR_HAND_LIMIT");
    expect(nextState.playerA.hand).toHaveLength(5);
  });

  it("debería descartar una carta y luego robar, manteniendo mano en 5", () => {
    const hand = [1, 2, 3, 4, 5].map((index) => createPhaseCard(`hand-${index}`));
    const state = {
      ...createPhaseBaseState(),
      activePlayerId: "p1",
      phase: "MAIN_1" as const,
      pendingTurnAction: { type: "DISCARD_FOR_HAND_LIMIT" as const, playerId: "p1" },
      playerA: { ...createPhaseBaseState().playerA, hand, deck: [createPhaseCard("new-draw")] },
    };

    const nextState = GameEngine.resolvePendingTurnAction(state, "p1", "hand-3");
    expect(nextState.pendingTurnAction).toBeNull();
    expect(nextState.playerA.graveyard.some((card) => card.id === "hand-3")).toBe(true);
    expect(nextState.playerA.hand).toHaveLength(5);
    expect(nextState.playerA.hand.some((card) => card.id === "new-draw")).toBe(true);
  });

  it("debería permitir invocar entidad reemplazando una del campo lleno", () => {
    const state = {
      ...createPhaseBaseState(),
      activePlayerId: "p1",
      phase: "MAIN_1" as const,
      playerA: {
        ...createPhaseBaseState().playerA,
        currentEnergy: 8,
        hand: [createPhaseCard("new-entity")],
        activeEntities: [createPhaseEntity("a-1", "a-card-1"), createPhaseEntity("a-2", "a-card-2"), createPhaseEntity("a-3", "a-card-3")],
      },
    };

    const nextState = GameEngine.playCardWithEntityReplacement(state, "p1", "new-entity", "ATTACK", "a-2");
    expect(nextState.playerA.activeEntities).toHaveLength(3);
    expect(nextState.playerA.activeEntities.some((entity) => entity.card.id === "new-entity")).toBe(true);
    expect(nextState.playerA.graveyard.some((card) => card.id === "a-card-2")).toBe(true);
    expect(nextState.playerA.hand).toHaveLength(0);
  });
});
