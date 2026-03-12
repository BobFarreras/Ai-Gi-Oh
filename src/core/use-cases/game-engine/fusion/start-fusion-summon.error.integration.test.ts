// src/core/use-cases/game-engine/fusion/start-fusion-summon.error.integration.test.ts - Pruebas de error para validar límites de turno/fase al iniciar fusión manual.
import { describe, expect, it } from "vitest";
import { ICard } from "@/core/entities/ICard";
import { IBoardEntity } from "@/core/entities/IPlayer";
import { GameEngine, GameState } from "@/core/use-cases/GameEngine";

const fusionCard: ICard = {
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

function createEntity(instanceId: string, cardId: string): IBoardEntity {
  return {
    instanceId,
    card: {
      id: cardId,
      name: cardId,
      description: "",
      type: "ENTITY",
      faction: "OPEN_SOURCE",
      cost: 5,
      attack: 1000,
      defense: 1000,
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
      hand: [fusionCard],
      graveyard: [],
      activeEntities: [createEntity("m1", "entity-chatgpt"), createEntity("m2", "entity-gemini")],
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

describe("startFusionSummon errores de flujo", () => {
  it("falla si existe una acción obligatoria pendiente", () => {
    const state = {
      ...createState(),
      pendingTurnAction: { type: "DISCARD_FOR_HAND_LIMIT" as const, playerId: "p1" },
    };
    expect(() => GameEngine.startFusionSummon(state, "p1", "fusion-gemgpt", "ATTACK")).toThrow(
      "Debes resolver la acción obligatoria antes de iniciar la fusión.",
    );
  });

  it("falla si el jugador no es el activo", () => {
    const state = { ...createState(), activePlayerId: "p2" };
    expect(() => GameEngine.startFusionSummon(state, "p1", "fusion-gemgpt", "ATTACK")).toThrow("No es tu turno.");
  });

  it("falla fuera de MAIN_1", () => {
    const state = { ...createState(), phase: "BATTLE" as const };
    expect(() => GameEngine.startFusionSummon(state, "p1", "fusion-gemgpt", "ATTACK")).toThrow(
      "Solo puedes iniciar fusión en MAIN_1.",
    );
  });
});
