// src/core/services/opponent/HeuristicOpponentStrategy.difficulty.test.ts - Comprueba diferencias de evaluación de ataques según dificultad heurística.
import { describe, expect, it } from "vitest";
import { GameState } from "@/core/use-cases/GameEngine";
import { HeuristicOpponentStrategy } from "./HeuristicOpponentStrategy";
import { createBaseState, createBoardEntity } from "./HeuristicOpponentStrategy.test-fixtures";

describe("HeuristicOpponentStrategy dificultad", () => {
  it("debería evitar intercambios claramente perdedores incluso en EASY", () => {
    const hardStrategy = new HeuristicOpponentStrategy({ difficulty: "HARD" });
    const easyStrategy = new HeuristicOpponentStrategy({ difficulty: "EASY" });
    const baseState = createBaseState();
    const state: GameState = {
      ...baseState,
      phase: "BATTLE",
      playerA: {
        ...baseState.playerA,
        activeEntities: [
          createBoardEntity(
            "p1-wall",
            {
              id: "p1-wall-card",
              name: "Muralla",
              description: "Defensa elevada",
              type: "ENTITY",
              faction: "BIG_TECH",
              cost: 3,
              attack: 800,
              defense: 2600,
            },
            "DEFENSE",
          ),
        ],
      },
      playerB: {
        ...baseState.playerB,
        hand: [],
        activeEntities: [
          createBoardEntity("p2-weak-attacker", {
            id: "p2-weak-attacker-card",
            name: "Probe",
            description: "Atacante débil",
            type: "ENTITY",
            faction: "OPEN_SOURCE",
            cost: 1,
            attack: 1000,
            defense: 700,
          }),
        ],
      },
    };

    expect(hardStrategy.chooseAttack(state, "p2")).toBeNull();
    expect(easyStrategy.chooseAttack(state, "p2")).toBeNull();
  });

  it("debería atacar para cerrar partida aunque el score base sea bajo", () => {
    const hardStrategy = new HeuristicOpponentStrategy({ difficulty: "HARD" });
    const baseState = createBaseState();
    const state: GameState = {
      ...baseState,
      phase: "BATTLE",
      playerA: { ...baseState.playerA, healthPoints: 1200, activeEntities: [] },
      playerB: {
        ...baseState.playerB,
        hand: [],
        activeEntities: [
          createBoardEntity("p2-lethal", {
            id: "p2-lethal-card",
            name: "Lethal",
            description: "Cierra partida",
            type: "ENTITY",
            faction: "BIG_TECH",
            cost: 4,
            attack: 1500,
            defense: 800,
          }),
        ],
      },
    };

    expect(hardStrategy.chooseAttack(state, "p2")).not.toBeNull();
  });

  it("debería permitir un trade negativo si limpia una amenaza crítica", () => {
    const hardStrategy = new HeuristicOpponentStrategy({ difficulty: "HARD" });
    const baseState = createBaseState();
    const state: GameState = {
      ...baseState,
      phase: "BATTLE",
      playerA: {
        ...baseState.playerA,
        activeEntities: [
          createBoardEntity("p1-threat", {
            id: "p1-threat-card",
            name: "Threat",
            description: "Amenaza crítica",
            type: "ENTITY",
            faction: "BIG_TECH",
            cost: 7,
            attack: 3000,
            defense: 3000,
          }),
        ],
      },
      playerB: {
        ...baseState.playerB,
        hand: [],
        activeEntities: [
          createBoardEntity("p2-clear", {
            id: "p2-clear-card",
            name: "Clearer",
            description: "Intercambio",
            type: "ENTITY",
            faction: "OPEN_SOURCE",
            cost: 3,
            attack: 3000,
            defense: 100,
          }),
        ],
      },
    };

    const decision = hardStrategy.chooseAttack(state, "p2");
    expect(decision?.defenderInstanceId).toBe("p1-threat");
  });
});
