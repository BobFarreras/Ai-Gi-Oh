// src/core/use-cases/game-engine/actions/resolve-execution.error.integration.test.ts - Pruebas de rutas de error para resolución de ejecuciones inválidas.
import { describe, expect, it } from "vitest";
import { ICard } from "@/core/entities/ICard";
import { GameEngine } from "@/core/use-cases/GameEngine";
import {
  createExecutionEntity,
  createExecutionTestPlayer,
  createResolveExecutionBaseState,
} from "@/core/use-cases/game-engine/effects/resolve-execution.test-fixtures";

describe("resolveExecution errores", () => {
  it("falla cuando la ejecución no existe en el tablero", () => {
    const state = createResolveExecutionBaseState();
    expect(() => GameEngine.resolveExecution(state, "p1", "missing-exec")).toThrow("La ejecución no existe en el tablero.");
  });

  it("falla cuando la carta no tiene efecto programado", () => {
    const noEffectExecution: ICard = {
      id: "exec-no-effect",
      name: "No Effect",
      description: "",
      type: "EXECUTION",
      faction: "NEUTRAL",
      cost: 1,
    };
    const state = createResolveExecutionBaseState({
      activeExecutions: [createExecutionEntity("exec-1", noEffectExecution)],
    });
    expect(() => GameEngine.resolveExecution(state, "p1", "exec-1")).toThrow("Esta carta no tiene un efecto programado.");
  });

  it("falla cuando se intenta resolver una trampa con acción de ejecución", () => {
    const trapCard: ICard = {
      id: "trap-1",
      name: "Trap",
      description: "",
      type: "TRAP",
      faction: "NEUTRAL",
      cost: 1,
      effect: { action: "DAMAGE", target: "OPPONENT", value: 300 },
    };
    const state = createResolveExecutionBaseState({
      activeExecutions: [createExecutionEntity("trap-1", trapCard, "SET")],
    });
    expect(() => GameEngine.resolveExecution(state, "p1", "trap-1")).toThrow("Solo las ejecuciones activadas pueden resolverse con esta acción.");
  });

  it("falla cuando un efecto de retorno no tiene cartas válidas en cementerio", () => {
    const returnExecution: ICard = {
      id: "exec-return-empty",
      name: "Return Empty",
      description: "",
      type: "EXECUTION",
      faction: "NEUTRAL",
      cost: 1,
      effect: { action: "RETURN_GRAVEYARD_CARD_TO_HAND", cardType: "ENTITY" },
    };
    const playerA = createExecutionTestPlayer("p1");
    playerA.activeExecutions = [createExecutionEntity("exec-1", returnExecution)];
    const state = createResolveExecutionBaseState(playerA);
    expect(() => GameEngine.resolveExecution(state, "p1", "exec-1")).toThrow("No hay cartas válidas en cementerio para este efecto.");
  });
});
