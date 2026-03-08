// src/core/use-cases/game-engine/actions/resolve-execution.fusion-waiting.test.ts - Verifica que una ejecución de fusión quede en espera si faltan materiales sin bloquear el flujo.
import { describe, expect, it } from "vitest";
import { ICard } from "@/core/entities/ICard";
import { IBoardEntity } from "@/core/entities/IPlayer";
import { GameEngine, GameState } from "@/core/use-cases/GameEngine";

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
  const executionEntity: IBoardEntity = {
    instanceId: "exec-1",
    card: fusionExecution,
    mode: "ACTIVATE",
    hasAttackedThisTurn: false,
    isNewlySummoned: false,
  };
  return {
    playerA: {
      id: "p1",
      name: "Neo",
      healthPoints: 8000,
      maxHealthPoints: 8000,
      currentEnergy: 10,
      maxEnergy: 10,
      deck: [],
      hand: [],
      graveyard: [],
      activeEntities: [
        {
          instanceId: "mat-1",
          mode: "ATTACK",
          hasAttackedThisTurn: false,
          isNewlySummoned: false,
          card: { id: "entity-one", name: "One", description: "", type: "ENTITY", faction: "OPEN_SOURCE", cost: 2, attack: 900, defense: 900 },
        },
      ],
      activeExecutions: [executionEntity],
    },
    playerB: {
      id: "p2",
      name: "Smith",
      healthPoints: 8000,
      maxHealthPoints: 8000,
      currentEnergy: 10,
      maxEnergy: 10,
      deck: [],
      hand: [],
      graveyard: [],
      activeEntities: [],
      activeExecutions: [],
    },
    activePlayerId: "p1",
    startingPlayerId: "p1",
    turn: 1,
    phase: "MAIN_1",
    hasNormalSummonedThisTurn: false,
    pendingTurnAction: null,
    combatLog: [],
  };
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
