// src/core/use-cases/game-engine/phases/resolve-pending-turn-action.error.integration.test.ts - Pruebas de rutas de error al resolver acciones obligatorias de turno.
import { describe, expect, it } from "vitest";
import { ICard } from "@/core/entities/ICard";
import { GameEngine } from "@/core/use-cases/GameEngine";
import { createExecutionEntity } from "@/core/use-cases/game-engine/effects/resolve-execution.test-fixtures";
import { createPhaseBaseState, createPhaseCard, createPhaseEntity } from "@/core/use-cases/game-engine/phases/phase-state.test-fixtures";

describe("resolvePendingTurnAction errores", () => {
  it("falla cuando no existe acción pendiente", () => {
    expect(() => GameEngine.resolvePendingTurnAction(createPhaseBaseState(), "p1", "any")).toThrow("No hay acción obligatoria pendiente.");
  });

  it("falla cuando el jugador no coincide con la acción pendiente o no es activo", () => {
    const state = {
      ...createPhaseBaseState(),
      activePlayerId: "p1",
      phase: "MAIN_1" as const,
      pendingTurnAction: { type: "DISCARD_FOR_HAND_LIMIT" as const, playerId: "p1" },
    };
    expect(() => GameEngine.resolvePendingTurnAction(state, "p2", "hand-1")).toThrow(
      "Solo el jugador activo puede resolver la acción obligatoria.",
    );
  });

  it("falla si en descarte se selecciona una carta inexistente en mano", () => {
    const state = {
      ...createPhaseBaseState(),
      activePlayerId: "p1",
      phase: "MAIN_1" as const,
      pendingTurnAction: { type: "DISCARD_FOR_HAND_LIMIT" as const, playerId: "p1" },
      playerA: { ...createPhaseBaseState().playerA, hand: [createPhaseCard("hand-1")] },
    };
    expect(() => GameEngine.resolvePendingTurnAction(state, "p1", "missing-card")).toThrow("La carta seleccionada no está en tu mano.");
  });

  it("falla si en fusión se selecciona una entidad inexistente", () => {
    const state = {
      ...createPhaseBaseState(),
      activePlayerId: "p1",
      phase: "MAIN_1" as const,
      pendingTurnAction: {
        type: "SELECT_FUSION_MATERIALS" as const,
        playerId: "p1",
        fusionCardId: "fusion-1",
        mode: "ATTACK" as const,
        selectedMaterialInstanceIds: [],
      },
      playerA: { ...createPhaseBaseState().playerA, activeEntities: [createPhaseEntity("m1", "mat-1")] },
    };
    expect(() => GameEngine.resolvePendingTurnAction(state, "p1", "missing-material")).toThrow(
      "La entidad seleccionada no existe en tu campo.",
    );
  });

  it("falla si en retorno de cementerio ya no existe la ejecución pendiente", () => {
    const effectCard: ICard = {
      id: "exec-return",
      name: "Return",
      description: "",
      type: "EXECUTION",
      faction: "NEUTRAL",
      cost: 1,
      effect: { action: "RETURN_GRAVEYARD_CARD_TO_HAND", cardType: "ENTITY" },
    };
    const state = {
      ...createPhaseBaseState(),
      activePlayerId: "p1",
      phase: "MAIN_1" as const,
      pendingTurnAction: {
        type: "SELECT_GRAVEYARD_CARD" as const,
        playerId: "p1",
        executionInstanceId: "exec-1",
        destination: "HAND" as const,
        cardType: "ENTITY" as const,
      },
      playerA: {
        ...createPhaseBaseState().playerA,
        activeExecutions: [createExecutionEntity("different-exec", effectCard)],
        graveyard: [createPhaseCard("grave-entity")],
      },
    };
    expect(() => GameEngine.resolvePendingTurnAction(state, "p1", "grave-entity")).toThrow("La ejecución pendiente ya no está disponible.");
  });
});
