// src/core/use-cases/game-engine/fusion/start-fusion-summon-from-execution.error.integration.test.ts - Pruebas de error para iniciar fusión desde ejecución fuera de flujo válido.
import { describe, expect, it } from "vitest";
import {
  createExecutionFusionBaseState,
  createFusionMaterialEntity,
} from "@/core/use-cases/game-engine/fusion/fusion-test-fixtures";
import { startFusionSummonFromExecution } from "@/core/use-cases/game-engine/fusion/start-fusion-summon-from-execution";

describe("startFusionSummonFromExecution errores de flujo", () => {
  it("falla si existe acción pendiente", () => {
    const state = {
      ...createExecutionFusionBaseState(),
      pendingTurnAction: { type: "DISCARD_FOR_HAND_LIMIT" as const, playerId: "p1" },
    };
    expect(() => startFusionSummonFromExecution(state, "p1", "exec-1", "fusion-gemgpt")).toThrow(
      "Debes resolver la acción obligatoria antes de iniciar la fusión.",
    );
  });

  it("falla si no es el turno del jugador", () => {
    const state = { ...createExecutionFusionBaseState(), activePlayerId: "p2" };
    expect(() => startFusionSummonFromExecution(state, "p1", "exec-1", "fusion-gemgpt")).toThrow("No es tu turno.");
  });

  it("falla fuera de MAIN_1", () => {
    const state = { ...createExecutionFusionBaseState(), phase: "BATTLE" as const };
    expect(() => startFusionSummonFromExecution(state, "p1", "exec-1", "fusion-gemgpt")).toThrow(
      "Solo puedes iniciar fusión en MAIN_1.",
    );
  });

  it("falla si faltan materiales válidos de receta", () => {
    const state = createExecutionFusionBaseState();
    state.playerA.activeEntities = [createFusionMaterialEntity("m1", "entity-chatgpt", "BIG_TECH"), createFusionMaterialEntity("mX", "entity-otro", "BIG_TECH")];
    expect(() => startFusionSummonFromExecution(state, "p1", "exec-1", "fusion-gemgpt")).toThrow(
      "No puedes fusionar: faltan materiales válidos en el campo.",
    );
  });
});
