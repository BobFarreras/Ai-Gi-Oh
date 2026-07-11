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

  it("debería cambiar de DEFENSE a ATTACK antes de pasar turno si puede presionar", () => {
    const strategy = new HeuristicOpponentStrategy({ difficulty: "MYTHIC" });
    const baseState = createBaseState();
    let state: GameState = {
      ...baseState,
      phase: "BATTLE",
      playerA: {
        ...baseState.playerA,
        activeEntities: [
          createBoardEntity("p1-guard", {
            id: "p1-guard-card",
            name: "Guard",
            description: "Defensa media",
            type: "ENTITY",
            faction: "OPEN_SOURCE",
            cost: 2,
            attack: 1200,
            defense: 1400,
          }),
        ],
      },
      playerB: {
        ...baseState.playerB,
        hand: [],
        activeEntities: [
          createBoardEntity("p2-def", {
            id: "p2-def-card",
            name: "Defender Bot",
            description: "Puede girar para presionar",
            type: "ENTITY",
            faction: "BIG_TECH",
            cost: 3,
            attack: 2200,
            defense: 1900,
          }, "DEFENSE"),
        ],
      },
    };

    state = runOpponentStep(state, "p2", strategy);
    expect(state.playerB.activeEntities[0]?.mode).toBe("ATTACK");
    state = runOpponentStep(state, "p2", strategy);
    expect(state.playerA.activeEntities).toHaveLength(0);
  });

  it("repliega a DEFENSA un tanque amenazado que está en ATAQUE (no aguantaría atacando)", () => {
    const strategy = new HeuristicOpponentStrategy();
    const baseState = createBaseState();
    const state: GameState = {
      ...baseState,
      phase: "BATTLE",
      playerA: {
        ...baseState.playerA,
        activeEntities: [
          createBoardEntity("p1-striker", {
            id: "p1-striker-card", name: "Striker", description: "Atacante fuerte",
            type: "ENTITY", faction: "BIG_TECH", cost: 3, attack: 1800, defense: 1000,
          }),
        ],
      },
      playerB: {
        ...baseState.playerB,
        hand: [],
        activeEntities: [
          createBoardEntity("p2-tank", {
            id: "p2-tank-card", name: "Tank", description: "Alta defensa, poco ataque",
            type: "ENTITY", faction: "OPEN_SOURCE", cost: 3, attack: 800, defense: 2000,
          }),
        ],
      },
    };

    const decision = strategy.chooseModeChange(state, "p2");
    expect(decision).toEqual({ instanceId: "p2-tank", newMode: "DEFENSE" });
  });

  it("NO repliega un atacante que puede ganar un intercambio (evita oscilación con la promoción)", () => {
    const strategy = new HeuristicOpponentStrategy();
    const baseState = createBaseState();
    const state: GameState = {
      ...baseState,
      phase: "BATTLE",
      playerA: {
        ...baseState.playerA,
        activeEntities: [
          createBoardEntity("p1-big", {
            id: "p1-big-card", name: "Big", description: "Atacante enorme",
            type: "ENTITY", faction: "BIG_TECH", cost: 4, attack: 1900, defense: 1200,
          }),
          createBoardEntity("p1-weak", {
            id: "p1-weak-card", name: "Weak", description: "Defensor débil",
            type: "ENTITY", faction: "OPEN_SOURCE", cost: 1, attack: 500, defense: 1000,
          }, "DEFENSE"),
        ],
      },
      playerB: {
        ...baseState.playerB,
        hand: [],
        activeEntities: [
          createBoardEntity("p2-bruiser", {
            id: "p2-bruiser-card", name: "Bruiser", description: "Ataque alto y defensa alta",
            type: "ENTITY", faction: "OPEN_SOURCE", cost: 4, attack: 1800, defense: 2000,
          }),
        ],
      },
    };

    // Aunque su defensa (2000) supera la amenaza (1900), puede ganar el intercambio contra el
    // defensor débil (1800 >= 1000) atacando, así que no debe replegarse.
    expect(strategy.chooseModeChange(state, "p2")).toBeNull();
  });

  it("NO repliega si el rival no tiene atacantes (sin amenaza que temer)", () => {
    const strategy = new HeuristicOpponentStrategy();
    const baseState = createBaseState();
    const state: GameState = {
      ...baseState,
      phase: "BATTLE",
      playerA: {
        ...baseState.playerA,
        activeEntities: [
          createBoardEntity("p1-wall", {
            id: "p1-wall-card", name: "Wall", description: "Solo defiende",
            type: "ENTITY", faction: "BIG_TECH", cost: 3, attack: 2500, defense: 2500,
          }, "DEFENSE"),
        ],
      },
      playerB: {
        ...baseState.playerB,
        hand: [],
        activeEntities: [
          createBoardEntity("p2-tank", {
            id: "p2-tank-card", name: "Tank", description: "Alta defensa, poco ataque",
            type: "ENTITY", faction: "OPEN_SOURCE", cost: 3, attack: 800, defense: 2000,
          }),
        ],
      },
    };

    expect(strategy.chooseModeChange(state, "p2")).toBeNull();
  });
});
