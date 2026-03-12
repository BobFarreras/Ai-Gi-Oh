// src/core/use-cases/game-engine/fusion/fusion-from-execution.integration.test.ts - Verifica el flujo de fusión activada desde ejecución y sus efectos en tablero/log.
import { describe, expect, it } from "vitest";
import { ICard } from "@/core/entities/ICard";
import { GameEngine, GameState } from "@/core/use-cases/GameEngine";
import { createTestGameState, createTestPlayer } from "@/core/use-cases/game-engine/test-support/state-fixtures";

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
  return createTestGameState({
    playerA: createTestPlayer("p1", {
      name: "Neo",
      hand: [fusionExecution],
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
    }),
    playerB: createTestPlayer("p2", { name: "Smith" }),
    activePlayerId: "p1",
    startingPlayerId: "p1",
    turn: 2,
    phase: "MAIN_1",
  });
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

