// src/core/use-cases/game-engine/effects/resolve-execution.test-fixtures.ts - Fixtures compartidas para pruebas de resolución de ejecuciones y selección desde cementerio.
import { ICard } from "@/core/entities/ICard";
import { IBoardEntity, IPlayer } from "@/core/entities/IPlayer";
import { GameState } from "@/core/use-cases/GameEngine";

export function createNeutralEntityCard(id: string, attack = 1000, defense = 900): ICard {
  return {
    id,
    name: id,
    description: "",
    type: "ENTITY",
    faction: "NEUTRAL",
    cost: 2,
    attack,
    defense,
  };
}

export function createExecutionEntity(instanceId: string, card: ICard, mode: "ACTIVATE" | "SET" = "ACTIVATE"): IBoardEntity {
  return {
    instanceId,
    card,
    mode,
    hasAttackedThisTurn: false,
    isNewlySummoned: false,
  };
}

export function createExecutionTestPlayer(id: string): IPlayer {
  return {
    id,
    name: id,
    healthPoints: 8000,
    maxHealthPoints: 8000,
    currentEnergy: 10,
    maxEnergy: 10,
    deck: [],
    fusionDeck: [],
    hand: [],
    graveyard: [],
    destroyedPile: [],
    activeEntities: [],
    activeExecutions: [],
  };
}

/**
 * Crea un estado base consistente para pruebas de resolveExecution.
 */
export function createResolveExecutionBaseState(playerA?: Partial<IPlayer>): GameState {
  const basePlayerA = createExecutionTestPlayer("p1");
  const basePlayerB = createExecutionTestPlayer("p2");
  return {
    playerA: { ...basePlayerA, ...playerA },
    playerB: basePlayerB,
    activePlayerId: "p1",
    startingPlayerId: "p1",
    turn: 2,
    phase: "MAIN_1",
    hasNormalSummonedThisTurn: false,
    pendingTurnAction: null,
    combatLog: [],
  };
}
