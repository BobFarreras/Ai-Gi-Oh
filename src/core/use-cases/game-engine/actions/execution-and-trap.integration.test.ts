// src/core/use-cases/game-engine/actions/execution-and-trap.integration.test.ts - Pruebas de reglas de ejecución y armado de trampas en zona de ejecuciones.
import { describe, expect, it } from "vitest";
import { GameEngine } from "@/core/use-cases/GameEngine";
import {
  createActionBaseState,
  createBoardEntity,
  spellCard,
  trapCard,
} from "@/core/use-cases/game-engine/actions/play-and-execution.test-fixtures";

describe("GameEngine execution and trap rules", () => {
  it("debería validar reglas de ejecución y resolver curación", () => {
    const fullExecutionZone = createActionBaseState();
    fullExecutionZone.playerA.hand = [spellCard];
    fullExecutionZone.playerA.activeExecutions = [1, 2, 3].map((id) => createBoardEntity(`exec-${id}`, spellCard, "SET"));

    expect(() => GameEngine.playCard(fullExecutionZone, "p1", "spell-1", "SET")).toThrow("Tu zona de ejecuciones está llena.");
    expect(() => GameEngine.playCard(createActionBaseState(), "p1", "spell-1", "ATTACK")).toThrow("Modo inválido para una ejecución.");

    let state = createActionBaseState();
    state = GameEngine.playCard(state, "p1", "spell-1", "ACTIVATE");
    const executionId = state.playerA.activeExecutions[0].instanceId;
    state = GameEngine.resolveExecution(state, "p1", executionId);

    expect(state.playerA.healthPoints).toBe(7500);
    expect(state.playerA.activeExecutions).toHaveLength(0);
    expect(state.playerA.graveyard[0]?.id).toBe("spell-1");
  });

  it("debería permitir armar trampas en SET y bloquear ACTIVAR", () => {
    const state = {
      ...createActionBaseState(),
      playerA: {
        ...createActionBaseState().playerA,
        hand: [trapCard],
      },
    };

    expect(() => GameEngine.playCard(state, "p1", "trap-1", "ACTIVATE")).toThrow("Modo inválido para una trampa.");

    const next = GameEngine.playCard(state, "p1", "trap-1", "SET");
    expect(next.playerA.activeExecutions).toHaveLength(1);
    expect(next.playerA.activeExecutions[0].card.type).toBe("TRAP");
    expect(next.playerA.activeExecutions[0].mode).toBe("SET");
  });
});
