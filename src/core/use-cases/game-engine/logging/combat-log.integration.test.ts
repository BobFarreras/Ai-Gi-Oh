// src/core/use-cases/game-engine/logging/combat-log.integration.test.ts - Verifica registro e integridad de eventos en combatLog durante acciones de juego.
import { describe, expect, it } from "vitest";
import { ICard } from "@/core/entities/ICard";
import { GameEngine, GameState } from "@/core/use-cases/GameEngine";
import { IGameEngineIdFactory } from "@/core/use-cases/game-engine/state/id-factory";
import { createTestGameState, createTestPlayer } from "@/core/use-cases/game-engine/test-support/state-fixtures";

const entityCard: ICard = {
  id: "entity-log-1",
  name: "Logger",
  description: "Entidad para tests de log",
  type: "ENTITY",
  faction: "OPEN_SOURCE",
  cost: 2,
  attack: 1200,
  defense: 800,
};

function createState(): GameState {
  return createTestGameState({
    playerA: createTestPlayer("p1", { name: "Neo", hand: [entityCard] }),
    playerB: createTestPlayer("p2", { name: "Smith" }),
    activePlayerId: "p1",
    startingPlayerId: "p2",
    turn: 2,
    phase: "MAIN_1",
  });
}

describe("GameEngine CombatLog", () => {
  it("debería usar idFactory inyectada para ids y timestamp", () => {
    const deterministicFactory: IGameEngineIdFactory = {
      createEntityInstanceId: (cardId: string) => `entity-fixed-${cardId}`,
      createFusionInstanceId: (cardId: string) => `fusion-fixed-${cardId}`,
      createRevivedInstanceId: (cardId: string, slotIndex: number) => `revived-fixed-${cardId}-${slotIndex}`,
      createCombatLogEventId: (eventType) => `log-fixed-${eventType}`,
      createTimestampIso: () => "2026-03-12T00:00:00.000Z",
    };
    const state = GameEngine.playCard({ ...createState(), idFactory: deterministicFactory }, "p1", "entity-log-1", "ATTACK");
    expect(state.playerA.activeEntities[0]?.instanceId).toBe("entity-fixed-entity-log-1");
    expect(state.combatLog[state.combatLog.length - 1]).toMatchObject({
      id: "log-fixed-CARD_PLAYED",
      timestamp: "2026-03-12T00:00:00.000Z",
    });
  });

  it("debería registrar CARD_PLAYED con id de carta", () => {
    const state = GameEngine.playCard(createState(), "p1", "entity-log-1", "ATTACK");
    const log = state.combatLog[state.combatLog.length - 1];
    expect(log.eventType).toBe("CARD_PLAYED");
    expect(log.payload).toMatchObject({ cardId: "entity-log-1" });
  });

  it("debería registrar eventos en orden cronológico al cambiar turno", () => {
    let state = createState();
    state = { ...state, phase: "BATTLE", activePlayerId: "p2" };
    const next = GameEngine.nextPhase(state);
    const tail = next.combatLog.slice(-2).map((event) => event.eventType);
    expect(tail).toEqual(["TURN_STARTED", "ENERGY_GAINED"]);
  });

  it("debería registrar DIRECT_DAMAGE con jugador objetivo", () => {
    let state = createState();
    state = GameEngine.playCard(state, "p1", "entity-log-1", "ATTACK");
    const attackerId = state.playerA.activeEntities[0].instanceId;
    state = { ...state, phase: "BATTLE" };
    const next = GameEngine.executeAttack(state, "p1", attackerId);
    const damageLog = [...next.combatLog].reverse().find((event) => event.eventType === "DIRECT_DAMAGE");
    expect(damageLog?.payload).toMatchObject({ targetPlayerId: "p2" });
  });
});

