// src/core/services/opponent/HeuristicOpponentStrategy.test-fixtures.ts - Fixtures compartidos para escenarios de tests de la estrategia heurística del rival.
import { ICard } from "@/core/entities/ICard";
import { IBoardEntity } from "@/core/entities/IPlayer";
import { GameState } from "@/core/use-cases/GameEngine";

/**
 * Crea un estado base estable para construir escenarios de decisión del bot.
 */
export function createBaseState(): GameState {
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
    startingPlayerId: "p1",
    turn: 2,
    phase: "MAIN_1",
    hasNormalSummonedThisTurn: false,
    combatLog: [],
  };
}

/**
 * Estandariza la creación de entidades de tablero para reducir ruido en escenarios.
 */
export function createBoardEntity(instanceId: string, card: ICard, mode: "ATTACK" | "DEFENSE" = "ATTACK"): IBoardEntity {
  return {
    instanceId,
    card,
    mode,
    hasAttackedThisTurn: false,
    isNewlySummoned: false,
  };
}
