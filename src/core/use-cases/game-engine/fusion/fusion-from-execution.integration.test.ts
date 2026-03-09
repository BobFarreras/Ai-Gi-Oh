// src/core/use-cases/game-engine/fusion/fusion-from-execution.integration.test.ts - Descripción breve del módulo.
import { describe, expect, it } from "vitest";
import { ICard } from "@/core/entities/ICard";
import { GameEngine, GameState } from "@/core/use-cases/GameEngine";

const fusionExecution: ICard = {
  id: "exec-fusion-gemgpt",
  name: "Fusion Compiler",
  description: "Inicia fusión.",
  type: "EXECUTION",
  faction: "BIG_TECH",
  cost: 4,
  effect: { action: "FUSION_SUMMON", recipeId: "fusion-gemgpt", materialsRequired: 2 },
};

function createState(): GameState {
  return {
    playerA: {
      id: "p1",
      name: "Neo",
      healthPoints: 8000,
      maxHealthPoints: 8000,
      currentEnergy: 10,
      maxEnergy: 10,
      deck: [],
      hand: [fusionExecution],
      graveyard: [],
      activeEntities: [
        {
          instanceId: "m1",
          card: { id: "entity-chatgpt", name: "chatgpt", description: "", type: "ENTITY", faction: "BIG_TECH", cost: 5, attack: 1500, defense: 1200, archetype: "LLM" },
          mode: "ATTACK",
          hasAttackedThisTurn: false,
          isNewlySummoned: false,
        },
        {
          instanceId: "m2",
          card: { id: "entity-gemini", name: "gemini", description: "", type: "ENTITY", faction: "BIG_TECH", cost: 5, attack: 1500, defense: 1200, archetype: "LLM" },
          mode: "ATTACK",
          hasAttackedThisTurn: false,
          isNewlySummoned: false,
        },
      ],
      activeExecutions: [],
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
    turn: 2,
    phase: "MAIN_1",
    hasNormalSummonedThisTurn: false,
    pendingTurnAction: null,
    combatLog: [],
  };
}

describe("fusión desde ejecución", () => {
  it("debería iniciar selección y completar fusión al elegir 2 materiales", () => {
    let state = GameEngine.playCard(createState(), "p1", "exec-fusion-gemgpt", "ACTIVATE");
    const executionInstanceId = state.playerA.activeExecutions[0].instanceId;
    state = GameEngine.resolveExecution(state, "p1", executionInstanceId);
    expect(state.pendingTurnAction?.type).toBe("SELECT_FUSION_MATERIALS");
    expect(state.playerA.activeExecutions.some((entity) => entity.instanceId === executionInstanceId)).toBe(true);

    state = GameEngine.resolvePendingTurnAction(state, "p1", "m1");
    state = GameEngine.resolvePendingTurnAction(state, "p1", "m2");

    expect(state.pendingTurnAction).toBeNull();
    expect(state.playerA.activeEntities.some((entity) => entity.card.id === "fusion-gemgpt")).toBe(true);
    expect(state.playerA.graveyard.map((card) => card.id)).toEqual(
      expect.arrayContaining(["entity-chatgpt", "entity-gemini", "exec-fusion-gemgpt"]),
    );
  });

  it("si faltan materiales debe quedar en espera sin bloquear el flujo", () => {
    const base = createState();
    const stateWithOneMaterial: GameState = {
      ...base,
      playerA: {
        ...base.playerA,
        activeEntities: [base.playerA.activeEntities[0]],
      },
    };

    let state = GameEngine.playCard(stateWithOneMaterial, "p1", "exec-fusion-gemgpt", "ACTIVATE");
    const executionInstanceId = state.playerA.activeExecutions[0].instanceId;
    state = GameEngine.resolveExecution(state, "p1", executionInstanceId);

    expect(state.pendingTurnAction).toBeNull();
    expect(state.playerA.activeExecutions).toHaveLength(1);
    expect(state.playerA.activeExecutions[0].mode).toBe("SET");
    expect(state.playerA.graveyard.some((card) => card.id === "exec-fusion-gemgpt")).toBe(false);
  });
});

