// src/core/services/opponent/HeuristicOpponentStrategy.execution-specials.test.ts - Verifica uso inteligente de ejecuciones especiales y resolución de pendientes del bot.
import { describe, expect, it } from "vitest";
import { ICard } from "@/core/entities/ICard";
import { createBaseState } from "./HeuristicOpponentStrategy.test-fixtures";
import { HeuristicOpponentStrategy } from "./HeuristicOpponentStrategy";
import { runOpponentStep } from "./runOpponentStep";

function createStealExecutionCard(): ICard {
  return {
    id: "exec-steal",
    name: "Hijack",
    description: "",
    type: "EXECUTION",
    faction: "OPEN_SOURCE",
    cost: 2,
    effect: { action: "STEAL_OPPONENT_GRAVEYARD_CARD_TO_HAND", cardType: "ENTITY" },
  };
}

function createRevealExecutionCard(): ICard {
  return {
    id: "exec-reveal",
    name: "Reveal",
    description: "",
    type: "EXECUTION",
    faction: "NO_CODE",
    cost: 1,
    effect: { action: "REVEAL_OPPONENT_SET_CARD", zone: "ANY" },
  };
}

describe("HeuristicOpponentStrategy ejecuciones especiales", () => {
  it("activa STEAL_OPPONENT_GRAVEYARD_CARD_TO_HAND cuando hay objetivo válido", () => {
    const strategy = new HeuristicOpponentStrategy({ difficulty: "HARD" });
    const state = {
      ...createBaseState(),
      playerA: {
        ...createBaseState().playerA,
        graveyard: [
          {
            id: "entity-python",
            name: "Python",
            description: "",
            type: "ENTITY" as const,
            faction: "OPEN_SOURCE" as const,
            cost: 3,
            attack: 1200,
            defense: 1100,
          },
        ],
      },
      playerB: {
        ...createBaseState().playerB,
        hand: [createStealExecutionCard()],
      },
    };
    const decision = strategy.choosePlay(state, "p2");
    expect(decision).toEqual({ cardId: "exec-steal", mode: "ACTIVATE" });
  });

  it("setea STEAL_OPPONENT_GRAVEYARD_CARD_TO_HAND cuando no hay objetivo válido", () => {
    const strategy = new HeuristicOpponentStrategy({ difficulty: "HARD" });
    const state = {
      ...createBaseState(),
      playerB: {
        ...createBaseState().playerB,
        hand: [createStealExecutionCard()],
      },
    };
    const decision = strategy.choosePlay(state, "p2");
    expect(decision).toEqual({ cardId: "exec-steal", mode: "SET" });
  });

  it("resuelve selección automática de cementerio rival tras activar robo de cementerio", () => {
    const strategy = new HeuristicOpponentStrategy({ difficulty: "HARD" });
    const state = {
      ...createBaseState(),
      playerA: {
        ...createBaseState().playerA,
        graveyard: [
          {
            id: "entity-vscode",
            name: "VSCode",
            description: "",
            type: "ENTITY" as const,
            faction: "BIG_TECH" as const,
            cost: 2,
            attack: 800,
            defense: 1000,
          },
        ],
      },
      playerB: {
        ...createBaseState().playerB,
        hand: [createStealExecutionCard()],
      },
    };
    const afterPlay = runOpponentStep(state, "p2", strategy);
    const afterResolve = runOpponentStep(afterPlay, "p2", strategy);
    expect(afterResolve.pendingTurnAction?.type).toBe("SELECT_OPPONENT_GRAVEYARD_CARD");
    const afterSelection = runOpponentStep(afterResolve, "p2", strategy);
    expect(afterSelection.pendingTurnAction ?? null).toBeNull();
    expect(afterSelection.playerB.hand.some((card) => card.id === "entity-vscode")).toBe(true);
  });

  it("resuelve selección automática de carta seteada rival tras activar reveal", () => {
    const strategy = new HeuristicOpponentStrategy({ difficulty: "HARD" });
    const state = {
      ...createBaseState(),
      playerA: {
        ...createBaseState().playerA,
        activeEntities: [
          {
            instanceId: "p1-set",
            card: {
              id: "entity-react",
              name: "React",
              description: "",
              type: "ENTITY" as const,
              faction: "BIG_TECH" as const,
              cost: 4,
              attack: 1500,
              defense: 1100,
            },
            mode: "SET" as const,
            hasAttackedThisTurn: false,
            isNewlySummoned: false,
          },
        ],
      },
      playerB: {
        ...createBaseState().playerB,
        hand: [createRevealExecutionCard()],
      },
    };
    const afterPlay = runOpponentStep(state, "p2", strategy);
    const afterResolve = runOpponentStep(afterPlay, "p2", strategy);
    expect(afterResolve.pendingTurnAction?.type).toBe("SELECT_OPPONENT_SET_CARD");
    const afterSelection = runOpponentStep(afterResolve, "p2", strategy);
    expect(afterSelection.pendingTurnAction ?? null).toBeNull();
    expect(afterSelection.playerB.graveyard.some((card) => card.id === "exec-reveal")).toBe(true);
  });
});
