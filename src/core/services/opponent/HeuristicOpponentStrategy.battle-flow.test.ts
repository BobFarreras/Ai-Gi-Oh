// src/core/services/opponent/HeuristicOpponentStrategy.battle-flow.test.ts - Valida transición de fases y resolución de ataques en combate.
import { describe, expect, it } from "vitest";
import { GameState } from "@/core/use-cases/GameEngine";
import { HeuristicOpponentStrategy } from "./HeuristicOpponentStrategy";
import { createBaseState, createBoardEntity } from "./HeuristicOpponentStrategy.test-fixtures";
import { runOpponentStep } from "./runOpponentStep";

describe("HeuristicOpponentStrategy BATTLE flow", () => {
  it("debería ejecutar flujo automático de paso de fase y ataque", () => {
    const strategy = new HeuristicOpponentStrategy();
    let state = createBaseState();

    state = runOpponentStep(state, "p2", strategy);
    expect(state.phase).toBe("BATTLE");
    expect(state.playerB.activeEntities).toHaveLength(1);

    state.playerA.activeEntities = [
      createBoardEntity("p1-entity", {
        id: "p1-def",
        name: "Defender",
        description: "Defensa",
        type: "ENTITY",
        faction: "BIG_TECH",
        cost: 2,
        attack: 1000,
        defense: 800,
      }),
    ];
    state.playerB.activeEntities = state.playerB.activeEntities.map((entity) => ({ ...entity, isNewlySummoned: false }));

    state = runOpponentStep(state, "p2", strategy);
    expect(state.playerA.activeEntities).toHaveLength(0);
  });

  it("debería encadenar múltiples ataques y cerrar turno al terminar", () => {
    const strategy = new HeuristicOpponentStrategy();
    const baseState = createBaseState();
    let state: GameState = {
      ...baseState,
      phase: "BATTLE",
      playerA: {
        ...baseState.playerA,
        activeEntities: [
          createBoardEntity("p1-low-1", {
            id: "p1-low-card-1",
            name: "Defender 1",
            description: "Defensa baja",
            type: "ENTITY",
            faction: "BIG_TECH",
            cost: 1,
            attack: 700,
            defense: 700,
          }),
          createBoardEntity(
            "p1-low-2",
            {
              id: "p1-low-card-2",
              name: "Defender 2",
              description: "Defensa baja",
              type: "ENTITY",
              faction: "OPEN_SOURCE",
              cost: 1,
              attack: 600,
              defense: 600,
            },
            "DEFENSE",
          ),
        ],
      },
      playerB: {
        ...baseState.playerB,
        hand: [],
        activeEntities: [
          createBoardEntity("p2-atk-1", {
            id: "p2-atk-card-1",
            name: "Attacker 1",
            description: "Ataque medio",
            type: "ENTITY",
            faction: "OPEN_SOURCE",
            cost: 2,
            attack: 1500,
            defense: 1000,
          }),
          createBoardEntity("p2-atk-2", {
            id: "p2-atk-card-2",
            name: "Attacker 2",
            description: "Ataque alto",
            type: "ENTITY",
            faction: "BIG_TECH",
            cost: 3,
            attack: 2300,
            defense: 1600,
          }),
        ],
      },
    };

    state = runOpponentStep(state, "p2", strategy);
    expect(state.playerA.activeEntities).toHaveLength(1);
    state = runOpponentStep(state, "p2", strategy);
    expect(state.playerA.activeEntities).toHaveLength(0);
    state = runOpponentStep(state, "p2", strategy);
    expect(state.activePlayerId).toBe("p1");
  });

  it("debería atacar directamente cuando no hay defensores", () => {
    const strategy = new HeuristicOpponentStrategy();
    const baseState = createBaseState();
    const state: GameState = {
      ...baseState,
      phase: "BATTLE",
      playerA: { ...baseState.playerA, activeEntities: [], healthPoints: 8000 },
      playerB: {
        ...baseState.playerB,
        hand: [],
        activeEntities: [
          createBoardEntity("p2-direct-1", {
            id: "p2-direct-card-1",
            name: "Direct Striker",
            description: "Atacante directo",
            type: "ENTITY",
            faction: "BIG_TECH",
            cost: 3,
            attack: 1900,
            defense: 1000,
          }),
        ],
      },
    };

    const nextState = runOpponentStep(state, "p2", strategy);
    expect(nextState.playerA.healthPoints).toBe(6100);
  });
});
