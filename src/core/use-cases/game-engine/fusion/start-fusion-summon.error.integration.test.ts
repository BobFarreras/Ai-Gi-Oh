// src/core/use-cases/game-engine/fusion/start-fusion-summon.error.integration.test.ts - Pruebas de error para validar límites de turno/fase al iniciar fusión manual.
import { describe, expect, it } from "vitest";
import { GameEngine } from "@/core/use-cases/GameEngine";
import { createManualFusionBaseState } from "@/core/use-cases/game-engine/fusion/fusion-test-fixtures";

describe("startFusionSummon errores de flujo", () => {
  it("falla si existe una acción obligatoria pendiente", () => {
    const state = {
      ...createManualFusionBaseState(),
      pendingTurnAction: { type: "DISCARD_FOR_HAND_LIMIT" as const, playerId: "p1" },
    };
    expect(() => GameEngine.startFusionSummon(state, "p1", "fusion-gemgpt", "ATTACK")).toThrow(
      "Debes resolver la acción obligatoria antes de iniciar la fusión.",
    );
  });

  it("falla si el jugador no es el activo", () => {
    const state = { ...createManualFusionBaseState(), activePlayerId: "p2" };
    expect(() => GameEngine.startFusionSummon(state, "p1", "fusion-gemgpt", "ATTACK")).toThrow("No es tu turno.");
  });

  it("falla fuera de MAIN_1", () => {
    const state = { ...createManualFusionBaseState(), phase: "BATTLE" as const };
    expect(() => GameEngine.startFusionSummon(state, "p1", "fusion-gemgpt", "ATTACK")).toThrow(
      "Solo puedes iniciar fusión en MAIN_1.",
    );
  });
});
