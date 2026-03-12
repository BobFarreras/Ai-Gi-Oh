// src/core/use-cases/game-engine/actions/play-and-execution.test-fixtures.ts - Fixtures reutilizables para pruebas de juego de cartas, ejecución y cambio de modo.
import { ICard } from "@/core/entities/ICard";
import { IBoardEntity } from "@/core/entities/IPlayer";
import { GameState } from "@/core/use-cases/GameEngine";

export const entityCard: ICard = {
  id: "entity-1",
  name: "Gemini",
  description: "Entidad ofensiva.",
  type: "ENTITY",
  faction: "BIG_TECH",
  cost: 3,
  attack: 2500,
  defense: 2000,
};

export const spellCard: ICard = {
  id: "spell-1",
  name: "Patch Heal",
  description: "Recupera vida.",
  type: "EXECUTION",
  faction: "NO_CODE",
  cost: 2,
  effect: {
    action: "HEAL",
    target: "PLAYER",
    value: 500,
  },
};

export const trapCard: ICard = {
  id: "trap-1",
  name: "Counter Trap",
  description: "Responde a un ataque rival.",
  type: "TRAP",
  faction: "OPEN_SOURCE",
  cost: 2,
  trigger: "ON_OPPONENT_ATTACK_DECLARED",
  effect: {
    action: "DAMAGE",
    target: "OPPONENT",
    value: 500,
  },
};

/**
 * Crea una entidad de tablero con estado básico para escenarios de test.
 */
export function createBoardEntity(instanceId: string, card: ICard, mode: "ATTACK" | "DEFENSE" | "SET"): IBoardEntity {
  return {
    instanceId,
    card,
    mode,
    hasAttackedThisTurn: false,
    isNewlySummoned: false,
  };
}

/**
 * Estado base para pruebas de reglas de juego en fase MAIN_1.
 */
export function createActionBaseState(overrides?: Partial<GameState>): GameState {
  return {
    playerA: {
      id: "p1",
      name: "Neo",
      healthPoints: 7000,
      maxHealthPoints: 8000,
      currentEnergy: 5,
      maxEnergy: 10,
      deck: [],
      hand: [entityCard, spellCard, trapCard],
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
    startingPlayerId: "p1",
    turn: 1,
    phase: "MAIN_1",
    hasNormalSummonedThisTurn: false,
    combatLog: [],
    ...overrides,
  };
}
