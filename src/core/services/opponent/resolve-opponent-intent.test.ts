// src/core/services/opponent/resolve-opponent-intent.test.ts - Fija el orden de decisión del rival compartido por tablero y replay.
import { describe, expect, it, vi } from "vitest";
import { GameState } from "@/core/use-cases/GameEngine";
import { IOpponentAutoPick, IOpponentStrategy } from "./types";
import { resolveOpponentIntent } from "./resolve-opponent-intent";
import { buildOpponentIntentAction } from "./build-opponent-intent-action";

const OPPONENT_ID = "opponent";
const HUMAN_ID = "human";

const idleStrategy: IOpponentStrategy = {
  choosePlay: () => null,
  chooseAttack: () => null,
  chooseModeChange: () => null,
};

const autoPick: IOpponentAutoPick = {
  chooseCardToDiscard: (hand) => hand[0] ?? null,
  chooseEntityToSacrifice: (entities) => entities[0] ?? null,
};

function buildState(overrides: Partial<GameState> = {}): GameState {
  return {
    playerA: { id: HUMAN_ID, hand: [], activeEntities: [], activeExecutions: [], graveyard: [] },
    playerB: { id: OPPONENT_ID, hand: [], activeEntities: [], activeExecutions: [], graveyard: [] },
    activePlayerId: OPPONENT_ID,
    startingPlayerId: HUMAN_ID,
    phase: "MAIN_1",
    turn: 3,
    pendingTurnAction: null,
    ...overrides,
  } as unknown as GameState;
}

function resolve(state: GameState, strategy: IOpponentStrategy = idleStrategy) {
  return resolveOpponentIntent({ state, opponentId: OPPONENT_ID, strategy, autoPick });
}

const reactiveTrap = {
  instanceId: "trap-1",
  mode: "SET",
  card: { id: "trap-card", type: "TRAP", trigger: "ON_OPPONENT_ATTACK_DECLARED" },
};

describe("resolveOpponentIntent", () => {
  it("no decide nada fuera del turno del rival", () => {
    expect(resolve(buildState({ activePlayerId: HUMAN_ID }))).toEqual({ kind: "IDLE" });
  });

  it("resuelve primero la acción obligatoria del rival", () => {
    const state = buildState({
      pendingTurnAction: { playerId: OPPONENT_ID, type: "DISCARD_FOR_HAND_LIMIT" },
      playerB: { id: OPPONENT_ID, hand: [{ id: "card-1" }], activeEntities: [], activeExecutions: [], graveyard: [] },
    } as unknown as Partial<GameState>);
    expect(resolve(state)).toEqual({ kind: "RESOLVE_PENDING_TURN_ACTION", selectedId: "card-1" });
  });

  it("cancela la acción obligatoria cuando no hay selección posible", () => {
    const state = buildState({
      pendingTurnAction: { playerId: OPPONENT_ID, type: "DISCARD_FOR_HAND_LIMIT" },
    } as unknown as Partial<GameState>);
    expect(resolve(state)).toEqual({ kind: "CANCEL_PENDING_TURN_ACTION" });
  });

  it("resuelve una ejecución activada antes de plantear jugadas nuevas", () => {
    const choosePlay = vi.fn().mockReturnValue({ cardId: "otra", mode: "ATTACK" });
    const state = buildState({
      playerB: {
        id: OPPONENT_ID, hand: [], activeEntities: [], graveyard: [],
        activeExecutions: [{ instanceId: "exec-1", mode: "ACTIVATE", card: { id: "exec", type: "EXECUTION" } }],
      },
    } as unknown as Partial<GameState>);

    expect(resolve(state, { ...idleStrategy, choosePlay })).toEqual({
      kind: "RESOLVE_EXECUTION",
      instanceId: "exec-1",
      playerTrapPrompt: null,
    });
    expect(choosePlay).not.toHaveBeenCalled();
  });

  it("declara el ataque y expone las trampas elegibles del humano", () => {
    const state = buildState({
      phase: "BATTLE",
      playerA: {
        id: HUMAN_ID, hand: [], activeEntities: [], graveyard: [],
        activeExecutions: [reactiveTrap],
      },
    } as unknown as Partial<GameState>);
    const strategy = {
      ...idleStrategy,
      chooseAttack: () => ({ attackerInstanceId: "atk-1", defenderInstanceId: undefined }),
    };

    expect(resolve(state, strategy)).toEqual({
      kind: "ATTACK",
      decision: { attackerInstanceId: "atk-1", defenderInstanceId: undefined },
      playerTrapPrompt: {
        trigger: "ON_OPPONENT_ATTACK_DECLARED",
        eligibleTrapInstanceIds: ["trap-1"],
      },
    });
  });

  it("no ataca en el primer turno del iniciador y cede la fase", () => {
    const state = buildState({ phase: "BATTLE", turn: 1, startingPlayerId: OPPONENT_ID });
    const strategy = { ...idleStrategy, chooseAttack: vi.fn() };
    expect(resolve(state, strategy)).toEqual({ kind: "NEXT_PHASE" });
    expect(strategy.chooseAttack).not.toHaveBeenCalled();
  });

  it("cambia de modo solo cuando no hay ataque disponible", () => {
    const state = buildState({ phase: "BATTLE" });
    const strategy = {
      ...idleStrategy,
      chooseModeChange: () => ({ instanceId: "ent-1", newMode: "ATTACK" as const }),
    };
    expect(resolve(state, strategy)).toEqual({
      kind: "CHANGE_ENTITY_MODE",
      decision: { instanceId: "ent-1", newMode: "ATTACK" },
    });
  });

  it("cede la fase cuando no queda nada por hacer", () => {
    expect(resolve(buildState())).toEqual({ kind: "NEXT_PHASE" });
    expect(resolve(buildState({ phase: "BATTLE" }))).toEqual({ kind: "NEXT_PHASE" });
  });
});

describe("buildOpponentIntentAction", () => {
  it("codifica la elección de trampa del humano dentro del ataque del rival", () => {
    const intent = {
      kind: "ATTACK" as const,
      decision: { attackerInstanceId: "atk-1", defenderInstanceId: "def-1" },
      playerTrapPrompt: { trigger: "ON_OPPONENT_ATTACK_DECLARED" as const, eligibleTrapInstanceIds: ["trap-1"] },
    };

    expect(buildOpponentIntentAction(intent, { activate: true, chosenTrapInstanceId: "trap-1" })).toEqual({
      type: "ATTACK",
      payload: {
        attackerInstanceId: "atk-1",
        defenderInstanceId: "def-1",
        declineReactiveTrap: undefined,
        chosenTrapInstanceId: "trap-1",
      },
    });
    expect(buildOpponentIntentAction(intent, { activate: false })).toEqual({
      type: "ATTACK",
      payload: {
        attackerInstanceId: "atk-1",
        defenderInstanceId: "def-1",
        declineReactiveTrap: true,
        chosenTrapInstanceId: undefined,
      },
    });
  });

  it("no traduce a protocolo lo que no viaja por el journal", () => {
    expect(buildOpponentIntentAction({ kind: "IDLE" })).toBeNull();
    expect(buildOpponentIntentAction({ kind: "CANCEL_PENDING_TURN_ACTION" })).toBeNull();
  });
});
