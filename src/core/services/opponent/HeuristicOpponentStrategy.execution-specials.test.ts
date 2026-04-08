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

function createFusionExecutionCard(recipeId: string): ICard {
  return {
    id: "exec-fusion",
    name: "Fusion Script",
    description: "",
    type: "EXECUTION",
    faction: "NO_CODE",
    cost: 2,
    effect: { action: "FUSION_SUMMON", recipeId, materialsRequired: 2 },
  };
}

function createExecutionReactiveTrap(): ICard {
  return {
    id: "trap-def-fragment",
    name: "DEF Fragment",
    description: "",
    type: "TRAP",
    faction: "BIG_TECH",
    cost: 2,
    trigger: "ON_OPPONENT_EXECUTION_ACTIVATED",
    effect: { action: "REDUCE_OPPONENT_DEFENSE", value: 300 },
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

  it("prioriza invocar material faltante cuando prepara fusión por ejecución", () => {
    const strategy = new HeuristicOpponentStrategy({ difficulty: "EASY" });
    const base = createBaseState();
    const state = {
      ...base,
      playerB: {
        ...base.playerB,
        activeEntities: [
          {
            instanceId: "mat-chatgpt",
            card: {
              id: "entity-chatgpt",
              name: "ChatGPT",
              description: "",
              type: "ENTITY" as const,
              faction: "BIG_TECH" as const,
              cost: 5,
              attack: 1800,
              defense: 1600,
              archetype: "LLM" as const,
            },
            mode: "ATTACK" as const,
            hasAttackedThisTurn: false,
            isNewlySummoned: false,
          },
        ],
        hand: [
          createFusionExecutionCard("fusion-gemgpt"),
          {
            id: "entity-gemini",
            name: "Gemini",
            description: "",
            type: "ENTITY" as const,
            faction: "BIG_TECH" as const,
            cost: 5,
            attack: 1700,
            defense: 1500,
            archetype: "LLM" as const,
          },
          {
            id: "entity-fill",
            name: "Fill",
            description: "",
            type: "ENTITY" as const,
            faction: "OPEN_SOURCE" as const,
            cost: 2,
            attack: 900,
            defense: 900,
            archetype: "TOOL" as const,
          },
        ],
      },
    };

    const decision = strategy.choosePlay(state, "p2");
    expect(decision).toEqual({ cardId: "entity-gemini", mode: "ATTACK" });
  });

  it("activa una ejecución de fusión ya seteada cuando los materiales son válidos", () => {
    const strategy = new HeuristicOpponentStrategy({ difficulty: "NORMAL" });
    const base = createBaseState();
    const state = {
      ...base,
      playerB: {
        ...base.playerB,
        fusionDeck: [
          {
            id: "fusion-gemgpt",
            name: "GemGPT",
            description: "",
            type: "FUSION" as const,
            faction: "BIG_TECH" as const,
            cost: 6,
            attack: 2800,
            defense: 2100,
          },
        ],
        activeExecutions: [
          {
            instanceId: "set-fusion",
            card: createFusionExecutionCard("fusion-gemgpt"),
            mode: "SET" as const,
            hasAttackedThisTurn: false,
            isNewlySummoned: false,
          },
        ],
        activeEntities: [
          {
            instanceId: "mat-chatgpt",
            card: {
              id: "entity-chatgpt",
              name: "ChatGPT",
              description: "",
              type: "ENTITY" as const,
              faction: "BIG_TECH" as const,
              cost: 5,
              attack: 1800,
              defense: 1600,
              archetype: "LLM" as const,
            },
            mode: "ATTACK" as const,
            hasAttackedThisTurn: false,
            isNewlySummoned: false,
          },
          {
            instanceId: "mat-gemini",
            card: {
              id: "entity-gemini",
              name: "Gemini",
              description: "",
              type: "ENTITY" as const,
              faction: "BIG_TECH" as const,
              cost: 5,
              attack: 1700,
              defense: 1500,
              archetype: "LLM" as const,
            },
            mode: "ATTACK" as const,
            hasAttackedThisTurn: false,
            isNewlySummoned: false,
          },
        ],
      },
    };

    const next = runOpponentStep(state, "p2", strategy);
    expect(next.playerB.activeExecutions[0].mode).toBe("ACTIVATE");
    expect(next.phase).toBe("MAIN_1");
  });

  it("elige materiales válidos de receta durante selección pendiente de fusión", () => {
    const strategy = new HeuristicOpponentStrategy({ difficulty: "HARD" });
    const base = createBaseState();
    const state = {
      ...base,
      pendingTurnAction: {
        type: "SELECT_FUSION_MATERIALS" as const,
        playerId: "p2",
        fusionFromExecutionRecipeId: "fusion-gemgpt",
        mode: "ATTACK" as const,
        selectedMaterialInstanceIds: [],
      },
      playerB: {
        ...base.playerB,
        activeEntities: [
          {
            instanceId: "mat-chatgpt",
            card: {
              id: "entity-chatgpt",
              name: "ChatGPT",
              description: "",
              type: "ENTITY" as const,
              faction: "BIG_TECH" as const,
              cost: 5,
              attack: 1800,
              defense: 1600,
              archetype: "LLM" as const,
            },
            mode: "ATTACK" as const,
            hasAttackedThisTurn: false,
            isNewlySummoned: false,
          },
          {
            instanceId: "mat-python",
            card: {
              id: "entity-python",
              name: "Python",
              description: "",
              type: "ENTITY" as const,
              faction: "OPEN_SOURCE" as const,
              cost: 4,
              attack: 1400,
              defense: 1200,
              archetype: "LANGUAGE" as const,
            },
            mode: "ATTACK" as const,
            hasAttackedThisTurn: false,
            isNewlySummoned: false,
          },
          {
            instanceId: "mat-gemini",
            card: {
              id: "entity-gemini",
              name: "Gemini",
              description: "",
              type: "ENTITY" as const,
              faction: "BIG_TECH" as const,
              cost: 5,
              attack: 1700,
              defense: 1500,
              archetype: "LLM" as const,
            },
            mode: "ATTACK" as const,
            hasAttackedThisTurn: false,
            isNewlySummoned: false,
          },
        ],
      },
    };

    const next = runOpponentStep(state, "p2", strategy);
    expect(next.pendingTurnAction?.type).toBe("SELECT_FUSION_MATERIALS");
    expect(next.pendingTurnAction?.selectedMaterialInstanceIds).toEqual(["mat-chatgpt"]);
  });

  it("no auto-activa trampas seteadas aunque su efecto use acción de ejecución", () => {
    const strategy = new HeuristicOpponentStrategy({ difficulty: "NORMAL" });
    const base = createBaseState();
    const state = {
      ...base,
      playerB: {
        ...base.playerB,
        hand: [],
        activeExecutions: [
          {
            instanceId: "trap-set",
            card: createExecutionReactiveTrap(),
            mode: "SET" as const,
            hasAttackedThisTurn: false,
            isNewlySummoned: false,
          },
        ],
      },
      playerA: {
        ...base.playerA,
        activeEntities: [
          {
            instanceId: "p1-entity",
            card: {
              id: "p1-card",
              name: "P1",
              description: "",
              type: "ENTITY" as const,
              faction: "OPEN_SOURCE" as const,
              cost: 2,
              attack: 900,
              defense: 900,
            },
            mode: "ATTACK" as const,
            hasAttackedThisTurn: false,
            isNewlySummoned: false,
          },
        ],
      },
    };

    const next = runOpponentStep(state, "p2", strategy);
    expect(next.playerB.activeExecutions[0].mode).toBe("SET");
  });

  it("si el campo está lleno, reemplaza una entidad no material para preparar fusión", () => {
    const strategy = new HeuristicOpponentStrategy({ difficulty: "EASY" });
    const base = createBaseState();
    const state = {
      ...base,
      playerB: {
        ...base.playerB,
        activeEntities: [
          {
            instanceId: "mat-chatgpt",
            card: {
              id: "entity-chatgpt",
              name: "ChatGPT",
              description: "",
              type: "ENTITY" as const,
              faction: "BIG_TECH" as const,
              cost: 5,
              attack: 1800,
              defense: 1600,
              archetype: "LLM" as const,
            },
            mode: "ATTACK" as const,
            hasAttackedThisTurn: false,
            isNewlySummoned: false,
          },
          {
            instanceId: "filler-1",
            card: {
              id: "entity-fill-1",
              name: "Filler 1",
              description: "",
              type: "ENTITY" as const,
              faction: "OPEN_SOURCE" as const,
              cost: 1,
              attack: 300,
              defense: 400,
              archetype: "TOOL" as const,
            },
            mode: "ATTACK" as const,
            hasAttackedThisTurn: false,
            isNewlySummoned: false,
          },
          {
            instanceId: "filler-2",
            card: {
              id: "entity-fill-2",
              name: "Filler 2",
              description: "",
              type: "ENTITY" as const,
              faction: "OPEN_SOURCE" as const,
              cost: 2,
              attack: 600,
              defense: 500,
              archetype: "TOOL" as const,
            },
            mode: "ATTACK" as const,
            hasAttackedThisTurn: false,
            isNewlySummoned: false,
          },
        ],
        hand: [
          createFusionExecutionCard("fusion-gemgpt"),
          {
            id: "entity-gemini",
            name: "Gemini",
            description: "",
            type: "ENTITY" as const,
            faction: "BIG_TECH" as const,
            cost: 5,
            attack: 1700,
            defense: 1500,
            archetype: "LLM" as const,
          },
        ],
      },
    };

    const decision = strategy.choosePlay(state, "p2");
    expect(decision?.cardId).toBe("entity-gemini");
    expect(decision?.replaceEntityInstanceId === "filler-1" || decision?.replaceEntityInstanceId === "filler-2").toBe(true);
  });

  it("si la zona de ejecuciones está llena, reemplaza una slot para setear la mágica de fusión", () => {
    const strategy = new HeuristicOpponentStrategy({ difficulty: "EASY" });
    const base = createBaseState();
    const state = {
      ...base,
      playerB: {
        ...base.playerB,
        hand: [createFusionExecutionCard("fusion-gemgpt")],
        activeExecutions: [
          {
            instanceId: "slot-trap",
            card: {
              id: "trap-lite",
              name: "Trap Lite",
              description: "",
              type: "TRAP" as const,
              faction: "NO_CODE" as const,
              cost: 1,
              trigger: "ON_OPPONENT_ATTACK_DECLARED" as const,
              effect: { action: "NEGATE_ATTACK_AND_DESTROY_ATTACKER" as const },
            },
            mode: "SET" as const,
            hasAttackedThisTurn: false,
            isNewlySummoned: false,
          },
          {
            instanceId: "slot-exec",
            card: createStealExecutionCard(),
            mode: "SET" as const,
            hasAttackedThisTurn: false,
            isNewlySummoned: false,
          },
          {
            instanceId: "slot-fusion",
            card: createFusionExecutionCard("fusion-gemgpt"),
            mode: "SET" as const,
            hasAttackedThisTurn: false,
            isNewlySummoned: false,
          },
        ],
      },
    };

    const decision = strategy.choosePlay(state, "p2");
    expect(decision?.cardId).toBe("exec-fusion");
    expect(Boolean(decision?.replaceExecutionInstanceId)).toBe(true);
  });
});
