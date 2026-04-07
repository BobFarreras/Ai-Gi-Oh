// src/core/services/opponent/HeuristicOpponentStrategy.energy-plan.test.ts - Verifica cuándo la IA conserva energía para combos del siguiente turno.
import { describe, expect, it } from "vitest";
import { HeuristicOpponentStrategy } from "./HeuristicOpponentStrategy";
import { createBaseState, createBoardEntity } from "./HeuristicOpponentStrategy.test-fixtures";

describe("HeuristicOpponentStrategy energy planning", () => {
  it("debería pasar MAIN_1 para guardar energía si prepara combo de alto impacto", () => {
    const strategy = new HeuristicOpponentStrategy({ difficulty: "HARD", aiProfile: { style: "combo", aggression: 0.44 } });
    const baseState = createBaseState();
    const state = {
      ...baseState,
      playerB: {
        ...baseState.playerB,
        currentEnergy: 4,
        hand: [
          {
            id: "bot-shield-trap",
            name: "Shield Trap",
            description: "Protección",
            type: "TRAP" as const,
            faction: "NEUTRAL" as const,
            cost: 2,
            trigger: "ON_OPPONENT_ATTACK_DECLARED" as const,
            effect: { action: "NEGATE_ATTACK" as const },
          },
          {
            id: "fusion-overmind",
            name: "Overmind",
            description: "Fusión fuerte",
            type: "FUSION" as const,
            faction: "BIG_TECH" as const,
            cost: 6,
            attack: 3200,
            defense: 2400,
            fusionRecipeId: "fusion-overmind",
          },
        ],
        activeEntities: [
          createBoardEntity("mat-1", {
            id: "mat-1",
            name: "Material 1",
            description: "",
            type: "ENTITY",
            faction: "BIG_TECH",
            cost: 2,
            attack: 1000,
            defense: 1000,
            archetype: "LLM",
          }),
          createBoardEntity("mat-2", {
            id: "mat-2",
            name: "Material 2",
            description: "",
            type: "ENTITY",
            faction: "OPEN_SOURCE",
            cost: 2,
            attack: 900,
            defense: 1100,
            archetype: "LLM",
          }),
        ],
      },
    };

    const decision = strategy.choosePlay(state, "p2");
    expect(decision).toBeNull();
  });

  it("no debería guardar energía si hay amenaza urgente rival", () => {
    const strategy = new HeuristicOpponentStrategy({ difficulty: "HARD", aiProfile: { style: "combo", aggression: 0.44 } });
    const baseState = createBaseState();
    const state = {
      ...baseState,
      playerA: {
        ...baseState.playerA,
        activeEntities: [
          createBoardEntity("enemy-1", {
            id: "enemy-boss",
            name: "Enemy Boss",
            description: "",
            type: "ENTITY",
            faction: "NEUTRAL",
            cost: 4,
            attack: 3000,
            defense: 1800,
          }),
        ],
      },
      playerB: {
        ...baseState.playerB,
        healthPoints: 3000,
        currentEnergy: 4,
        hand: [
          {
            id: "bot-defender",
            name: "Bot Defender",
            description: "Muro",
            type: "ENTITY" as const,
            faction: "OPEN_SOURCE" as const,
            cost: 3,
            attack: 1300,
            defense: 2600,
          },
          {
            id: "fusion-overmind",
            name: "Overmind",
            description: "Fusión fuerte",
            type: "FUSION" as const,
            faction: "BIG_TECH" as const,
            cost: 6,
            attack: 3200,
            defense: 2400,
            fusionRecipeId: "fusion-overmind",
          },
        ],
      },
    };

    const decision = strategy.choosePlay(state, "p2");
    expect(decision).not.toBeNull();
  });
});
