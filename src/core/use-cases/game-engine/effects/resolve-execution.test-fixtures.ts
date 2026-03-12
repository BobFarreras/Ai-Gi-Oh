// src/core/use-cases/game-engine/effects/resolve-execution.test-fixtures.ts - Fixtures compartidas para pruebas de resolución de ejecuciones y selección desde cementerio.
import { ICard } from "@/core/entities/ICard";
import { IBoardEntity, IPlayer } from "@/core/entities/IPlayer";
import { GameState } from "@/core/use-cases/GameEngine";
import { createTestGameState, createTestPlayer } from "@/core/use-cases/game-engine/test-support/state-fixtures";

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
  return createTestPlayer(id, { fusionDeck: [], destroyedPile: [] });
}

/**
 * Crea un estado base consistente para pruebas de resolveExecution.
 */
export function createResolveExecutionBaseState(playerA?: Partial<IPlayer>): GameState {
  return createTestGameState({
    playerA: { ...createExecutionTestPlayer("p1"), ...playerA },
    playerB: createExecutionTestPlayer("p2"),
    activePlayerId: "p1",
    startingPlayerId: "p1",
    turn: 2,
    phase: "MAIN_1",
  });
}
