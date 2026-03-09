// src/core/use-cases/game-engine/logging/combat-log.integration.test.ts - Descripción breve del módulo.
import { describe, expect, it } from "vitest";
import { ICard } from "@/core/entities/ICard";
import { GameEngine, GameState } from "@/core/use-cases/GameEngine";

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
  return {
    playerA: {
      id: "p1",
      name: "Neo",
      healthPoints: 8000,
      maxHealthPoints: 8000,
      currentEnergy: 10,
      maxEnergy: 10,
      deck: [],
      hand: [entityCard],
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
    phase: "MAIN_1",
    hasNormalSummonedThisTurn: false,
    pendingTurnAction: null,
    combatLog: [],
  };
}

describe("GameEngine CombatLog", () => {
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

