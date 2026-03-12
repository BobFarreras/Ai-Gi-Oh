// src/core/use-cases/game-engine/fusion/fusion-test-fixtures.ts - Fixtures reutilizables para escenarios de fusión manual y fusión desde ejecución.
import { ICard } from "@/core/entities/ICard";
import { GameState } from "@/core/use-cases/GameEngine";
import {
  createTestBoardEntity,
  createTestGameState,
  createTestPlayer,
} from "@/core/use-cases/game-engine/test-support/state-fixtures";

/**
 * Carta de fusión base para pruebas del flujo GemGPT.
 */
export function createGemGptFusionCard(): ICard {
  return {
    id: "fusion-gemgpt",
    name: "GemGPT",
    description: "Fusion",
    type: "FUSION",
    faction: "BIG_TECH",
    cost: 7,
    attack: 3200,
    defense: 2600,
    fusionRecipeId: "fusion-gemgpt",
    fusionEnergyRequirement: 10,
  };
}

/**
 * Carta de ejecución que inicia invocación por fusión.
 */
export function createFusionExecutionCard(): ICard {
  return {
    id: "exec-fusion-gemgpt",
    name: "Fusion Compiler",
    description: "Inicia fusión.",
    type: "EXECUTION",
    faction: "BIG_TECH",
    cost: 4,
    effect: { action: "FUSION_SUMMON", recipeId: "fusion-gemgpt", materialsRequired: 2 },
  };
}

/**
 * Crea una entidad material estándar del arquetipo LLM para tests de fusión.
 */
export function createFusionMaterialEntity(instanceId: string, cardId: string, faction: "OPEN_SOURCE" | "BIG_TECH" = "OPEN_SOURCE") {
  return createTestBoardEntity(
    instanceId,
    {
      id: cardId,
      name: cardId,
      description: "",
      type: "ENTITY",
      faction,
      cost: 5,
      attack: 1500,
      defense: 1200,
      archetype: "LLM",
    },
    "ATTACK",
  );
}

/**
 * Estado base para pruebas de fusión manual (carta en mano).
 */
export function createManualFusionBaseState(): GameState {
  return createTestGameState({
    playerA: createTestPlayer("p1", {
      name: "Neo",
      hand: [createGemGptFusionCard()],
      activeEntities: [
        createFusionMaterialEntity("m1", "entity-chatgpt"),
        createFusionMaterialEntity("m2", "entity-gemini"),
      ],
    }),
    playerB: createTestPlayer("p2", { name: "Smith" }),
    activePlayerId: "p1",
    startingPlayerId: "p1",
    turn: 2,
    phase: "MAIN_1",
  });
}

/**
 * Estado base para pruebas de fusión iniciada por ejecución activa.
 */
export function createExecutionFusionBaseState(): GameState {
  return createTestGameState({
    playerA: createTestPlayer("p1", {
      name: "Neo",
      fusionDeck: [createGemGptFusionCard()],
      activeEntities: [
        createFusionMaterialEntity("m1", "entity-chatgpt", "BIG_TECH"),
        createFusionMaterialEntity("m2", "entity-gemini", "BIG_TECH"),
      ],
      activeExecutions: [createTestBoardEntity("exec-1", createFusionExecutionCard(), "ACTIVATE")],
    }),
    playerB: createTestPlayer("p2", { name: "Smith" }),
    activePlayerId: "p1",
    startingPlayerId: "p1",
    turn: 2,
    phase: "MAIN_1",
  });
}
