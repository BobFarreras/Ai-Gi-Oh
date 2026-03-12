// src/core/use-cases/game-engine/fusion/fusion-selection-flow.integration.test.ts - Valida la selección de materiales de fusión como acción pendiente de turno.
import { describe, expect, it } from "vitest";
import { GameEngine } from "@/core/use-cases/GameEngine";
import {
  createFusionMaterialEntity,
  createManualFusionBaseState,
} from "@/core/use-cases/game-engine/fusion/fusion-test-fixtures";

describe("GameEngine flujo de selección de fusión", () => {
  it("debería iniciar selección de materiales como acción pendiente", () => {
    const started = GameEngine.startFusionSummon(createManualFusionBaseState(), "p1", "fusion-gemgpt", "ATTACK");
    expect(started.pendingTurnAction?.type).toBe("SELECT_FUSION_MATERIALS");
    if (started.pendingTurnAction?.type === "SELECT_FUSION_MATERIALS") {
      expect(started.pendingTurnAction.selectedMaterialInstanceIds).toHaveLength(0);
      expect(started.pendingTurnAction.fusionCardId).toBe("fusion-gemgpt");
    }
  });

  it("debería completar fusión al seleccionar 2 materiales", () => {
    let state = GameEngine.startFusionSummon(createManualFusionBaseState(), "p1", "fusion-gemgpt", "ATTACK");
    state = GameEngine.resolvePendingTurnAction(state, "p1", "m1");
    expect(state.pendingTurnAction?.type).toBe("SELECT_FUSION_MATERIALS");
    if (state.pendingTurnAction?.type === "SELECT_FUSION_MATERIALS") {
      expect(state.pendingTurnAction.selectedMaterialInstanceIds).toEqual(["m1"]);
    }

    state = GameEngine.resolvePendingTurnAction(state, "p1", "m2");
    expect(state.pendingTurnAction).toBeNull();
    expect(state.playerA.activeEntities.some((entity) => entity.card.id === "fusion-gemgpt")).toBe(true);
    expect(state.playerA.graveyard.map((card) => card.id)).toEqual(expect.arrayContaining(["entity-chatgpt", "entity-gemini"]));
  });

  it("debería fallar sin bloquear si no hay 2 materiales válidos", () => {
    const state = createManualFusionBaseState();
    state.playerA.activeEntities = [
      createFusionMaterialEntity("m1", "entity-chatgpt"),
      createFusionMaterialEntity("mX", "entity-otro"),
    ];
    expect(() => GameEngine.startFusionSummon(state, "p1", "fusion-gemgpt", "ATTACK")).toThrow(
      "No puedes fusionar: faltan materiales válidos en el campo.",
    );
    const afterNextPhase = GameEngine.nextPhase(state);
    expect(afterNextPhase.phase).toBe("BATTLE");
    expect(afterNextPhase.pendingTurnAction).toBeNull();
  });
});

