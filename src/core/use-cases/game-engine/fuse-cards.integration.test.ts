import { describe, expect, it } from "vitest";
import { ICard } from "@/core/entities/ICard";
import { GameEngine, GameState } from "@/core/use-cases/GameEngine";

const fusionCard: ICard = {
  id: "fusion-p1-overmind",
  name: "Overmind Nexus",
  description: "Fusion",
  type: "FUSION",
  faction: "BIG_TECH",
  cost: 6,
  attack: 2800,
  defense: 2200,
  fusionRecipeId: "fusion-p1-overmind",
};

function stateWithMaterials(overrides?: Partial<GameState>): GameState {
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
      activeEntities: [
        {
          instanceId: "m1",
          card: { id: "a1", name: "A1", description: "", type: "ENTITY", faction: "OPEN_SOURCE", cost: 2, attack: 800, defense: 1000, archetype: "LLM" },
          mode: "ATTACK",
          hasAttackedThisTurn: false,
          isNewlySummoned: false,
        },
        {
          instanceId: "m2",
          card: { id: "a2", name: "A2", description: "", type: "ENTITY", faction: "OPEN_SOURCE", cost: 3, attack: 1100, defense: 1050, archetype: "LLM" },
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
    ...overrides,
  };
}

describe("GameEngine fusión", () => {
  it("debería fusionar materiales válidos y crear la carta resultado", () => {
    const next = GameEngine.fuseCards(stateWithMaterials(), "p1", "fusion-p1-overmind", ["m1", "m2"], "ATTACK");
    expect(next.playerA.hand.some((card) => card.id === "fusion-p1-overmind")).toBe(false);
    expect(next.playerA.activeEntities.some((entity) => entity.card.id === "fusion-p1-overmind")).toBe(true);
    expect(next.playerA.graveyard.map((card) => card.id)).toEqual(expect.arrayContaining(["a1", "a2"]));
  });

  it("debería fallar si los materiales no cumplen receta", () => {
    const invalid = stateWithMaterials({
      playerA: {
        ...stateWithMaterials().playerA,
        activeEntities: [
          { ...stateWithMaterials().playerA.activeEntities[0], card: { ...stateWithMaterials().playerA.activeEntities[0].card, archetype: "TOOL" } },
          stateWithMaterials().playerA.activeEntities[1],
        ],
      },
    });
    expect(() => GameEngine.fuseCards(invalid, "p1", "fusion-p1-overmind", ["m1", "m2"], "ATTACK")).toThrow();
  });
});
