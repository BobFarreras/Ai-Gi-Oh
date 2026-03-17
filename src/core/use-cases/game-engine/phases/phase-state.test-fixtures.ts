// src/core/use-cases/game-engine/phases/phase-state.test-fixtures.ts - Fixtures compartidas para pruebas de mantenimiento y transición de fases.
import { ICard } from "@/core/entities/ICard";
import { IBoardEntity } from "@/core/entities/IPlayer";
import { GameState } from "@/core/use-cases/GameEngine";
import { createTestGameState, createTestPlayer } from "@/core/use-cases/game-engine/test-support/state-fixtures";

export function createPhaseCard(id: string, type: "ENTITY" | "EXECUTION" = "ENTITY"): ICard {
  return {
    id,
    name: id,
    description: "Carta de test",
    type,
    faction: "NEUTRAL",
    cost: 1,
    attack: type === "ENTITY" ? 1000 : undefined,
    defense: type === "ENTITY" ? 1000 : undefined,
    effect: type === "EXECUTION" ? { action: "DAMAGE", target: "OPPONENT", value: 300 } : undefined,
  };
}

export function createPhaseEntity(instanceId: string, cardId: string): IBoardEntity {
  return {
    instanceId,
    card: createPhaseCard(cardId),
    mode: "ATTACK",
    hasAttackedThisTurn: false,
    isNewlySummoned: false,
  };
}

/**
 * Estado base reutilizable para pruebas de fases en turno de cierre (BATTLE -> MAIN_1).
 */
export function createPhaseBaseState(): GameState {
  return createTestGameState({
    playerA: createTestPlayer("p1", { name: "Neo", deck: [createPhaseCard("p1-deck-1")] }),
    playerB: createTestPlayer("p2", { name: "Smith", deck: [createPhaseCard("p2-deck-1")] }),
    activePlayerId: "p2",
    startingPlayerId: "p1",
    turn: 2,
    phase: "BATTLE",
  });
}
