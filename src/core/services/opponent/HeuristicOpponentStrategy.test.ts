import { describe, expect, it } from "vitest";
import { GameState } from "@/core/use-cases/GameEngine";
import { HeuristicOpponentStrategy } from "./HeuristicOpponentStrategy";
import { runOpponentStep } from "./runOpponentStep";

function createState(): GameState {
  return {
    playerA: {
      id: "p1",
      name: "Player",
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
    playerB: {
      id: "p2",
      name: "Bot",
      healthPoints: 8000,
      maxHealthPoints: 8000,
      currentEnergy: 6,
      maxEnergy: 10,
      deck: [],
      hand: [
        {
          id: "bot-entity",
          name: "Bot Soldier",
          description: "Entidad de combate",
          type: "ENTITY",
          faction: "OPEN_SOURCE",
          cost: 3,
          attack: 2200,
          defense: 1200,
        },
      ],
      graveyard: [],
      activeEntities: [],
      activeExecutions: [],
    },
    activePlayerId: "p2",
    turn: 1,
    phase: "MAIN_1",
    hasNormalSummonedThisTurn: false,
  };
}

describe("HeuristicOpponentStrategy", () => {
  it("debería elegir una jugada válida en MAIN_1", () => {
    const strategy = new HeuristicOpponentStrategy();
    const decision = strategy.choosePlay(createState(), "p2");

    expect(decision).not.toBeNull();
    expect(decision?.cardId).toBe("bot-entity");
  });

  it("debería ejecutar flujo automático de paso de fase y ataque", () => {
    const strategy = new HeuristicOpponentStrategy();
    let state = createState();

    state = runOpponentStep(state, "p2", strategy);
    expect(state.phase).toBe("BATTLE");
    expect(state.playerB.activeEntities.length).toBe(1);

    state.playerA.activeEntities = [
      {
        instanceId: "p1-entity",
        card: {
          id: "p1-def",
          name: "Defender",
          description: "Defensa",
          type: "ENTITY",
          faction: "BIG_TECH",
          cost: 2,
          attack: 1000,
          defense: 800,
        },
        mode: "ATTACK",
        hasAttackedThisTurn: false,
        isNewlySummoned: false,
      },
    ];
    state.playerB.activeEntities = state.playerB.activeEntities.map((entity) => ({ ...entity, isNewlySummoned: false }));

    state = runOpponentStep(state, "p2", strategy);
    expect(state.playerA.activeEntities.length).toBe(0);
  });
});
