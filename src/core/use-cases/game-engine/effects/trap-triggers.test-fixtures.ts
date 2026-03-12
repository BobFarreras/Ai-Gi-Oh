// src/core/use-cases/game-engine/effects/trap-triggers.test-fixtures.ts - Fixtures compartidas para pruebas de disparo y resolución de trampas.
import { ICard } from "@/core/entities/ICard";
import { IBoardEntity } from "@/core/entities/IPlayer";
import { GameState } from "@/core/use-cases/GameEngine";

export const attackerCard: ICard = {
  id: "atk-card",
  name: "Attacker",
  description: "",
  type: "ENTITY",
  faction: "BIG_TECH",
  cost: 3,
  attack: 1600,
  defense: 1000,
};

export const executionCard: ICard = {
  id: "exec-card",
  name: "Packet Storm",
  description: "",
  type: "EXECUTION",
  faction: "NO_CODE",
  cost: 2,
  effect: { action: "DAMAGE", target: "OPPONENT", value: 600 },
};

export const trapOnAttack: ICard = {
  id: "trap-on-attack",
  name: "Counter Intrusion",
  description: "",
  type: "TRAP",
  faction: "OPEN_SOURCE",
  cost: 2,
  trigger: "ON_OPPONENT_ATTACK_DECLARED",
  effect: { action: "DAMAGE", target: "OPPONENT", value: 500 },
};

export const trapOnExecution: ICard = {
  id: "trap-on-execution",
  name: "Runtime Punish",
  description: "",
  type: "TRAP",
  faction: "NO_CODE",
  cost: 2,
  trigger: "ON_OPPONENT_EXECUTION_ACTIVATED",
  effect: { action: "DAMAGE", target: "OPPONENT", value: 400 },
};

export const trapNegateAttack: ICard = {
  id: "trap-negate-attack",
  name: "Kernel Panic",
  description: "",
  type: "TRAP",
  faction: "OPEN_SOURCE",
  cost: 3,
  trigger: "ON_OPPONENT_ATTACK_DECLARED",
  effect: { action: "NEGATE_ATTACK_AND_DESTROY_ATTACKER" },
};

export const trapReduceDefenseOnExecution: ICard = {
  id: "trap-reduce-defense",
  name: "DEF Fragment",
  description: "",
  type: "TRAP",
  faction: "BIG_TECH",
  cost: 2,
  trigger: "ON_OPPONENT_EXECUTION_ACTIVATED",
  effect: { action: "REDUCE_OPPONENT_DEFENSE", value: 300 },
};

export const trapCounterTrap: ICard = {
  id: "trap-counter-trap",
  name: "Trap Firewall",
  description: "",
  type: "TRAP",
  faction: "OPEN_SOURCE",
  cost: 2,
  trigger: "ON_OPPONENT_TRAP_ACTIVATED",
  effect: { action: "NEGATE_OPPONENT_TRAP_AND_DESTROY" },
};

export function createTrapEntity(instanceId: string, card: ICard): IBoardEntity {
  return { instanceId, card, mode: "SET", hasAttackedThisTurn: false, isNewlySummoned: false };
}

/**
 * Estado base reutilizable para pruebas de trampas.
 */
export function createTrapBaseState(): GameState {
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
