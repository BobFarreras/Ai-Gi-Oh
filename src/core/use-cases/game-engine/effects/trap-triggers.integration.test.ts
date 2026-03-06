import { describe, expect, it } from "vitest";
import { ICard } from "@/core/entities/ICard";
import { IBoardEntity } from "@/core/entities/IPlayer";
import { GameEngine, GameState } from "@/core/use-cases/GameEngine";

const attackerCard: ICard = {
  id: "atk-card",
  name: "Attacker",
  description: "",
  type: "ENTITY",
  faction: "BIG_TECH",
  cost: 3,
  attack: 1600,
  defense: 1000,
};

const trapOnAttack: ICard = {
  id: "trap-on-attack",
  name: "Counter Intrusion",
  description: "",
  type: "TRAP",
  faction: "OPEN_SOURCE",
  cost: 2,
  trigger: "ON_OPPONENT_ATTACK_DECLARED",
  effect: { action: "DAMAGE", target: "OPPONENT", value: 500 },
};

const trapOnExecution: ICard = {
  id: "trap-on-execution",
  name: "Runtime Punish",
  description: "",
  type: "TRAP",
  faction: "NO_CODE",
  cost: 2,
  trigger: "ON_OPPONENT_EXECUTION_ACTIVATED",
  effect: { action: "DAMAGE", target: "OPPONENT", value: 400 },
};

const trapNegateAttack: ICard = {
  id: "trap-negate-attack",
  name: "Kernel Panic",
  description: "",
  type: "TRAP",
  faction: "OPEN_SOURCE",
  cost: 3,
  trigger: "ON_OPPONENT_ATTACK_DECLARED",
  effect: { action: "NEGATE_ATTACK_AND_DESTROY_ATTACKER" },
};

const trapReduceDefenseOnExecution: ICard = {
  id: "trap-reduce-defense",
  name: "DEF Fragment",
  description: "",
  type: "TRAP",
  faction: "BIG_TECH",
  cost: 2,
  trigger: "ON_OPPONENT_EXECUTION_ACTIVATED",
  effect: { action: "REDUCE_OPPONENT_DEFENSE", value: 300 },
};

const executionCard: ICard = {
  id: "exec-card",
  name: "Packet Storm",
  description: "",
  type: "EXECUTION",
  faction: "NO_CODE",
  cost: 2,
  effect: { action: "DAMAGE", target: "OPPONENT", value: 600 },
};

function createTrapEntity(instanceId: string, card: ICard): IBoardEntity {
  return { instanceId, card, mode: "SET", hasAttackedThisTurn: false, isNewlySummoned: false };
}

function baseState(): GameState {
  return {
    playerA: {
      id: "p1",
      name: "Neo",
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
    startingPlayerId: "p2",
    turn: 2,
    phase: "BATTLE",
    hasNormalSummonedThisTurn: false,
    pendingTurnAction: null,
    combatLog: [],
  };
}

describe("Trap triggers", () => {
  it("debería disparar trampa al declarar ataque y enviarla al cementerio", () => {
    const state: GameState = {
      ...baseState(),
      playerA: {
        ...baseState().playerA,
        activeEntities: [{ instanceId: "a1", card: attackerCard, mode: "ATTACK", hasAttackedThisTurn: false, isNewlySummoned: false }],
      },
      playerB: {
        ...baseState().playerB,
        activeExecutions: [createTrapEntity("t1", trapOnAttack)],
      },
    };

    const next = GameEngine.executeAttack(state, "p1", "a1");
    expect(next.playerA.healthPoints).toBe(7500);
    expect(next.playerB.activeExecutions).toHaveLength(0);
    expect(next.playerB.graveyard.some((card) => card.id === "trap-on-attack")).toBe(true);
    expect(next.combatLog.some((event) => event.eventType === "TRAP_TRIGGERED")).toBe(true);
  });

  it("debería disparar trampa cuando el rival activa una ejecución", () => {
    let state: GameState = {
      ...baseState(),
      phase: "MAIN_1",
      playerA: {
        ...baseState().playerA,
        hand: [executionCard],
      },
      playerB: {
        ...baseState().playerB,
        activeExecutions: [createTrapEntity("t2", trapOnExecution)],
      },
    };

    state = GameEngine.playCard(state, "p1", "exec-card", "ACTIVATE");
    const executionId = state.playerA.activeExecutions[0].instanceId;
    const next = GameEngine.resolveExecution(state, "p1", executionId);

    expect(next.playerA.healthPoints).toBe(7600);
    expect(next.playerB.activeExecutions).toHaveLength(0);
    expect(next.playerB.graveyard.some((card) => card.id === "trap-on-execution")).toBe(true);
    expect(next.playerB.healthPoints).toBe(7400);
  });

  it("debería anular ataque y destruir atacante con trampa de negación", () => {
    const state: GameState = {
      ...baseState(),
      playerA: {
        ...baseState().playerA,
        activeEntities: [{ instanceId: "a-neg", card: attackerCard, mode: "ATTACK", hasAttackedThisTurn: false, isNewlySummoned: false }],
      },
      playerB: {
        ...baseState().playerB,
        activeExecutions: [createTrapEntity("t-neg", trapNegateAttack)],
      },
    };

    const next = GameEngine.executeAttack(state, "p1", "a-neg");
    expect(next.playerA.activeEntities).toHaveLength(0);
    expect(next.playerA.graveyard.some((card) => card.id === "atk-card")).toBe(true);
    expect(next.playerB.healthPoints).toBe(8000);
    expect(next.combatLog.some((event) => event.eventType === "TRAP_TRIGGERED")).toBe(true);
  });

  it("debería reducir DEF de entidades rivales al activar ejecución", () => {
    let state: GameState = {
      ...baseState(),
      phase: "MAIN_1",
      playerA: {
        ...baseState().playerA,
        hand: [executionCard],
        activeEntities: [
          {
            instanceId: "p1-defender",
            card: {
              id: "p1-defender-card",
              name: "Defender",
              description: "",
              type: "ENTITY",
              faction: "OPEN_SOURCE",
              cost: 2,
              attack: 1000,
              defense: 1400,
            },
            mode: "DEFENSE",
            hasAttackedThisTurn: false,
            isNewlySummoned: false,
          },
        ],
      },
      playerB: {
        ...baseState().playerB,
        activeExecutions: [createTrapEntity("t-def", trapReduceDefenseOnExecution)],
      },
    };

    state = GameEngine.playCard(state, "p1", "exec-card", "ACTIVATE");
    const executionId = state.playerA.activeExecutions[0].instanceId;
    const next = GameEngine.resolveExecution(state, "p1", executionId);

    const defender = next.playerA.activeEntities.find((entity) => entity.instanceId === "p1-defender");
    expect(defender?.card.defense).toBe(1100);
  });
});
