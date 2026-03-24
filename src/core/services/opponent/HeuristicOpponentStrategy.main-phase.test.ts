// src/core/services/opponent/HeuristicOpponentStrategy.main-phase.test.ts - Verifica decisiones heurísticas en MAIN_1 y resolución de ejecuciones/fusiones.
import { describe, expect, it } from "vitest";
import { GameState } from "@/core/use-cases/GameEngine";
import { HeuristicOpponentStrategy } from "./HeuristicOpponentStrategy";
import { createBaseState, createBoardEntity } from "./HeuristicOpponentStrategy.test-fixtures";
import { runOpponentStep } from "./runOpponentStep";

describe("HeuristicOpponentStrategy MAIN_1", () => {
  it("debería elegir una jugada válida en MAIN_1", () => {
    const strategy = new HeuristicOpponentStrategy();
    const decision = strategy.choosePlay(createBaseState(), "p2");

    expect(decision).not.toBeNull();
    expect(decision?.cardId).toBe("bot-entity");
  });

  it("debería mantener MAIN_1 mientras existan jugadas útiles", () => {
    const strategy = new HeuristicOpponentStrategy();
    const baseState = createBaseState();
    const state: GameState = {
      ...baseState,
      playerB: {
        ...baseState.playerB,
        hand: [
          {
            id: "bot-ddos",
            name: "Bot DDoS",
            description: "Daño directo",
            type: "EXECUTION",
            faction: "NO_CODE",
            cost: 2,
            effect: { action: "DAMAGE", target: "OPPONENT", value: 600 },
          },
          {
            id: "bot-entity-2",
            name: "Bot Titan",
            description: "Entidad de campo",
            type: "ENTITY",
            faction: "BIG_TECH",
            cost: 3,
            attack: 2400,
            defense: 1500,
          },
        ],
      },
    };

    const nextState = runOpponentStep(state, "p2", strategy);
    expect(nextState.phase).toBe("MAIN_1");
    expect(nextState.playerB.hand).toHaveLength(1);
  });

  it("debería resolver ejecución ACTIVADA del rival y enviarla al cementerio", () => {
    const strategy = new HeuristicOpponentStrategy();
    const baseState = createBaseState();
    const state: GameState = {
      ...baseState,
      playerB: {
        ...baseState.playerB,
        currentEnergy: 4,
        hand: [
          {
            id: "bot-spell-dmg",
            name: "Bot Damage Script",
            description: "Daño directo",
            type: "EXECUTION",
            faction: "NO_CODE",
            cost: 2,
            effect: { action: "DAMAGE", target: "OPPONENT", value: 900 },
          },
        ],
      },
    };

    const afterActivate = runOpponentStep(state, "p2", strategy);
    expect(afterActivate.playerB.activeExecutions).toHaveLength(1);
    const afterResolve = runOpponentStep(afterActivate, "p2", strategy);
    expect(afterResolve.playerA.healthPoints).toBe(7100);
    expect(afterResolve.playerB.graveyard.some((card) => card.id === "bot-spell-dmg")).toBe(true);
  });

  it("debería fusionar cuando tiene receta válida y materiales en campo", () => {
    const strategy = new HeuristicOpponentStrategy({ difficulty: "HARD" });
    const baseState = createBaseState();
    const state: GameState = {
      ...baseState,
      playerB: {
        ...baseState.playerB,
        hand: [
          {
            id: "fusion-p2-overmind",
            name: "Smith Overmind",
            description: "Fusion",
            type: "FUSION",
            faction: "BIG_TECH",
            cost: 6,
            attack: 2800,
            defense: 2000,
            fusionRecipeId: "fusion-p2-overmind",
          },
        ],
        activeEntities: [
          createBoardEntity("core-1", {
            id: "core-card-1",
            name: "Core 1",
            description: "mat",
            type: "ENTITY",
            faction: "BIG_TECH",
            cost: 2,
            attack: 800,
            defense: 1000,
            archetype: "LLM",
          }),
          createBoardEntity("core-2", {
            id: "core-card-2",
            name: "Core 2",
            description: "mat",
            type: "ENTITY",
            faction: "OPEN_SOURCE",
            cost: 3,
            attack: 1100,
            defense: 1050,
            archetype: "LLM",
          }),
        ],
      },
    };

    const nextState = runOpponentStep(state, "p2", strategy);
    expect(nextState.playerB.activeEntities.some((entity) => entity.card.type === "FUSION")).toBe(true);
  });
});
