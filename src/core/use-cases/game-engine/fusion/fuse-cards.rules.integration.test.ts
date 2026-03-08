// src/core/use-cases/game-engine/fusion/fuse-cards.rules.integration.test.ts - Verifica reglas de validación y coste de energía de la invocación por fusión.
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

function createEntity(instanceId: string, cardId: string, archetype: "LLM" | "TOOL", cost: number): IBoardEntity {
  return {
    instanceId,
    card: { id: cardId, name: cardId, description: "", type: "ENTITY", faction: "OPEN_SOURCE", cost, attack: 1000, defense: 1000, archetype },
    mode: "ATTACK",
    hasAttackedThisTurn: false,
    isNewlySummoned: false,
  };
}

function createState(overrides?: Partial<GameState>): GameState {
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
      activeEntities: [createEntity("m1", "entity-chatgpt", "LLM", 5), createEntity("m2", "entity-gemini", "LLM", 5)],
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
    ...overrides,
  };
}

describe("GameEngine fusión - reglas", () => {
  it("debería permitir la fusión aunque la energía sea inferior al coste", () => {
    const state = createState({ playerA: { ...createState().playerA, currentEnergy: 9 } });
    const next = GameEngine.fuseCards(state, "p1", "fusion-gemgpt", ["m1", "m2"], "ATTACK");
    expect(next.playerA.currentEnergy).toBe(0);
  });

  it("debería consumir energía con clamp a 0 al invocar la fusión", () => {
    const next = GameEngine.fuseCards(createState(), "p1", "fusion-gemgpt", ["m1", "m2"], "ATTACK");
    expect(next.playerA.currentEnergy).toBe(0);
  });

  it("debería fallar si repites el mismo material", () => {
    expect(() => GameEngine.fuseCards(createState(), "p1", "fusion-gemgpt", ["m1", "m1"], "ATTACK")).toThrow(
      "Debes seleccionar 2 materiales distintos para fusionar.",
    );
  });

  it("debería fallar si uno de los materiales no existe", () => {
    expect(() => GameEngine.fuseCards(createState(), "p1", "fusion-gemgpt", ["m1", "unknown"], "ATTACK")).toThrow(
      "Uno de los materiales no existe en tu campo.",
    );
  });

  it("debería proteger de estados inválidos sin espacio en campo", () => {
    const invalidField = createState({
      playerA: {
        ...createState().playerA,
        activeEntities: [
          createEntity("m1", "entity-chatgpt", "LLM", 5),
          createEntity("m2", "entity-gemini", "LLM", 5),
          createEntity("m3", "entity-a", "LLM", 2),
          createEntity("m4", "entity-b", "LLM", 2),
          createEntity("m5", "entity-c", "LLM", 2),
        ],
      },
    });
    expect(() => GameEngine.fuseCards(invalidField, "p1", "fusion-gemgpt", ["m1", "m2"], "ATTACK")).toThrow(
      "No hay espacio en el campo para invocar la fusión.",
    );
  });
});
