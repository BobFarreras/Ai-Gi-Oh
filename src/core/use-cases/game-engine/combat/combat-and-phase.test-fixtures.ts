// src/core/use-cases/game-engine/combat/combat-and-phase.test-fixtures.ts - Fixtures compartidas para pruebas de combate y transición de turno.
import { ICard } from "@/core/entities/ICard";
import { IBoardEntity } from "@/core/entities/IPlayer";
import { GameState } from "@/core/use-cases/GameEngine";
import { createTestGameState, createTestPlayer } from "@/core/use-cases/game-engine/test-support/state-fixtures";

export const attackerCard: ICard = {
  id: "atk-1",
  name: "Attacker",
  description: "Entidad atacante.",
  type: "ENTITY",
  faction: "BIG_TECH",
  cost: 1,
  attack: 1500,
  defense: 1000,
};

export const defenderCard: ICard = {
  id: "def-1",
  name: "Defender",
  description: "Entidad defensora.",
  type: "ENTITY",
  faction: "OPEN_SOURCE",
  cost: 1,
  attack: 2000,
  defense: 2200,
};

export function createEntity(instanceId: string, card: ICard, mode: "ATTACK" | "DEFENSE" | "SET", attacked = false): IBoardEntity {
  return {
    instanceId,
    card,
    mode,
    hasAttackedThisTurn: attacked,
    isNewlySummoned: false,
  };
}

/**
 * Estado base para pruebas de combate en turno 2 con ambos jugadores en fase BATTLE.
 */
export function createCombatState(): GameState {
  return createTestGameState({
    playerA: createTestPlayer("p1", { name: "Neo", activeEntities: [createEntity("a-1", attackerCard, "ATTACK")] }),
    playerB: createTestPlayer("p2", { name: "Smith", activeEntities: [createEntity("d-1", defenderCard, "ATTACK")] }),
    activePlayerId: "p1",
    startingPlayerId: "p2",
    turn: 2,
    phase: "BATTLE",
    hasNormalSummonedThisTurn: true,
  });
}
