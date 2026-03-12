// src/core/use-cases/game-engine/actions/play-card-rules.integration.test.ts - Pruebas de validación y reglas de despliegue para cartas de entidad.
import { describe, expect, it } from "vitest";
import { GameEngine } from "@/core/use-cases/GameEngine";
import {
  createActionBaseState,
  createBoardEntity,
  entityCard,
} from "@/core/use-cases/game-engine/actions/play-and-execution.test-fixtures";

describe("GameEngine play card rules", () => {
  it("debería validar turno, fase y carta en mano", () => {
    expect(() => GameEngine.playCard(createActionBaseState({ activePlayerId: "p2" }), "p1", "entity-1", "ATTACK")).toThrow("No es tu turno.");
    expect(() => GameEngine.playCard(createActionBaseState({ phase: "BATTLE" }), "p1", "entity-1", "ATTACK")).toThrow("Solo puedes jugar cartas en la fase de despliegue.");
    expect(() => GameEngine.playCard(createActionBaseState(), "p1", "unknown", "ATTACK")).toThrow("La carta no está en la mano.");
  });

  it("debería validar energía y reglas de invocación de entidad", () => {
    const lowEnergyState = createActionBaseState();
    lowEnergyState.playerA.currentEnergy = 1;
    expect(() => GameEngine.playCard(lowEnergyState, "p1", "entity-1", "ATTACK")).toThrow("Energía insuficiente.");

    const summonUsed = createActionBaseState({ hasNormalSummonedThisTurn: true });
    expect(() => GameEngine.playCard(summonUsed, "p1", "entity-1", "ATTACK")).toThrow("Ya has invocado una entidad este turno.");

    const fullEntityZone = createActionBaseState();
    fullEntityZone.playerA.activeEntities = [1, 2, 3].map((id) => createBoardEntity(`slot-${id}`, entityCard, "ATTACK"));
    expect(() => GameEngine.playCard(fullEntityZone, "p1", "entity-1", "ATTACK")).toThrow("Tu zona de entidades está llena.");

    const setEntity = GameEngine.playCard(createActionBaseState(), "p1", "entity-1", "SET");
    expect(setEntity.playerA.activeEntities[0]?.mode).toBe("SET");

    const defenseEntity = GameEngine.playCard(createActionBaseState(), "p1", "entity-1", "DEFENSE");
    expect(defenseEntity.playerA.activeEntities[0]?.mode).toBe("SET");
  });
});
