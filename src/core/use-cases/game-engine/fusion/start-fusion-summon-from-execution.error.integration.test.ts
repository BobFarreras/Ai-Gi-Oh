// src/core/use-cases/game-engine/fusion/start-fusion-summon-from-execution.error.integration.test.ts - Pruebas de error para iniciar fusión desde ejecución fuera de flujo válido.
import { describe, expect, it } from "vitest";
import { ICard } from "@/core/entities/ICard";
import { IBoardEntity } from "@/core/entities/IPlayer";
import { GameState } from "@/core/use-cases/GameEngine";
import { startFusionSummonFromExecution } from "@/core/use-cases/game-engine/fusion/start-fusion-summon-from-execution";

const fusionExecution: ICard = {
  id: "exec-fusion-gemgpt",
  name: "Fusion Compiler",
  description: "Inicia fusión.",
  type: "EXECUTION",
  faction: "BIG_TECH",
  cost: 4,
  effect: { action: "FUSION_SUMMON", recipeId: "fusion-gemgpt", materialsRequired: 2 },
};

function createEntity(instanceId: string, cardId: string): IBoardEntity {
  return {
    instanceId,
    card: {
      id: cardId,
      name: cardId,
      description: "",
      type: "ENTITY",
      faction: "BIG_TECH",
      cost: 5,
      attack: 1500,
      defense: 1200,
      archetype: "LLM",
    },
    mode: "ATTACK",
    hasAttackedThisTurn: false,
    isNewlySummoned: false,
  };
}

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
      fusionDeck: [
        {
          id: "fusion-gemgpt",
          name: "GemGPT",
          description: "",
          type: "FUSION",
          faction: "BIG_TECH",
          cost: 7,
          attack: 3200,
          defense: 2600,
          fusionRecipeId: "fusion-gemgpt",
          fusionEnergyRequirement: 10,
        },
      ],
      hand: [],
      graveyard: [],
      activeEntities: [createEntity("m1", "entity-chatgpt"), createEntity("m2", "entity-gemini")],
      activeExecutions: [{ instanceId: "exec-1", card: fusionExecution, mode: "ACTIVATE", hasAttackedThisTurn: false, isNewlySummoned: false }],
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

describe("startFusionSummonFromExecution errores de flujo", () => {
  it("falla si existe acción pendiente", () => {
    const state = {
      ...createState(),
      pendingTurnAction: { type: "DISCARD_FOR_HAND_LIMIT" as const, playerId: "p1" },
    };
    expect(() => startFusionSummonFromExecution(state, "p1", "exec-1", "fusion-gemgpt")).toThrow(
      "Debes resolver la acción obligatoria antes de iniciar la fusión.",
    );
  });

  it("falla si no es el turno del jugador", () => {
    const state = { ...createState(), activePlayerId: "p2" };
    expect(() => startFusionSummonFromExecution(state, "p1", "exec-1", "fusion-gemgpt")).toThrow("No es tu turno.");
  });

  it("falla fuera de MAIN_1", () => {
    const state = { ...createState(), phase: "BATTLE" as const };
    expect(() => startFusionSummonFromExecution(state, "p1", "exec-1", "fusion-gemgpt")).toThrow(
      "Solo puedes iniciar fusión en MAIN_1.",
    );
  });
});
