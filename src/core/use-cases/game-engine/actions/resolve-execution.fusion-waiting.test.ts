// src/core/use-cases/game-engine/actions/resolve-execution.fusion-waiting.test.ts - Verifica que una ejecución de fusión quede en espera si faltan materiales sin bloquear el flujo.
import { describe, expect, it } from "vitest";
import { ICard } from "@/core/entities/ICard";
import { GameEngine, GameState } from "@/core/use-cases/GameEngine";
import {
  createTestBoardEntity,
  createTestGameState,
  createTestPlayer,
} from "@/core/use-cases/game-engine/test-support/state-fixtures";

const fusionExecution: ICard = {
  id: "exec-fusion-test",
  name: "Compilar Fusión",
  description: "Inicia selección de materiales.",
  type: "EXECUTION",
  faction: "BIG_TECH",
  cost: 2,
  effect: { action: "FUSION_SUMMON", recipeId: "fusion-python-vscode", materialsRequired: 2 },
};

function createState(): GameState {
  return createTestGameState({
    playerA: createTestPlayer("p1", {
      name: "Neo",
      activeEntities: [
        createTestBoardEntity("mat-1", { id: "entity-one", name: "One", description: "", type: "ENTITY", faction: "OPEN_SOURCE", cost: 2, attack: 900, defense: 900 }, "ATTACK"),
      ],
      activeExecutions: [createTestBoardEntity("exec-1", fusionExecution, "ACTIVATE")],
    }),
    playerB: createTestPlayer("p2", { name: "Smith" }),
    activePlayerId: "p1",
    startingPlayerId: "p1",
    turn: 1,
    phase: "MAIN_1",
  });
}

describe("resolveExecution fusión en espera", () => {
  it("recoloca la ejecución a SET y no crea pendingTurnAction cuando faltan materiales", () => {
    const next = GameEngine.resolveExecution(createState(), "p1", "exec-1");
    expect(next.pendingTurnAction).toBeNull();
    expect(next.playerA.activeExecutions).toHaveLength(1);
    expect(next.playerA.activeExecutions[0].mode).toBe("SET");
    expect(next.playerA.graveyard).toHaveLength(0);
  });

  it("permite continuar el flujo de turno tras quedar en espera por materiales faltantes", () => {
    const waitingState = GameEngine.resolveExecution(createState(), "p1", "exec-1");
    const afterNextPhase = GameEngine.nextPhase(waitingState);
    expect(afterNextPhase.pendingTurnAction).toBeNull();
    expect(afterNextPhase.phase).toBe("BATTLE");
  });
});
