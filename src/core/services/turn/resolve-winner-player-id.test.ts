// src/core/services/turn/resolve-winner-player-id.test.ts - Verifica ganador por KO, límite de turno y desempate por LP alcanzado antes.
import { describe, expect, it } from "vitest";
import { ICombatLogEvent } from "@/core/entities/ICombatLog";
import { createTestGameState } from "@/core/use-cases/game-engine/test-support/state-fixtures";
import { resolveWinnerPlayerId } from "@/core/services/turn/resolve-winner-player-id";

function createLogEvent(index: number, eventType: ICombatLogEvent["eventType"], targetPlayerId: string, amount: number): ICombatLogEvent {
  return {
    id: `evt-${index}`,
    turn: 1,
    phase: "MAIN_1",
    actorPlayerId: "p1",
    eventType,
    payload: { targetPlayerId, amount },
    timestamp: new Date(index * 1000).toISOString(),
  };
}

describe("resolveWinnerPlayerId", () => {
  it("resuelve ganador inmediato por KO", () => {
    const state = createTestGameState({
      turn: 4,
      playerA: { id: "p1", healthPoints: 0, maxHealthPoints: 8000, currentEnergy: 0, maxEnergy: 10, deck: [], hand: [], graveyard: [], destroyedPile: [], activeEntities: [], activeExecutions: [] },
      playerB: { id: "p2", healthPoints: 1200, maxHealthPoints: 8000, currentEnergy: 0, maxEnergy: 10, deck: [], hand: [], graveyard: [], destroyedPile: [], activeEntities: [], activeExecutions: [] },
    });
    expect(resolveWinnerPlayerId(state)).toBe("p2");
  });

  it("en turno límite gana quien tiene más LP", () => {
    const state = createTestGameState({
      turn: 30,
      playerA: { id: "p1", healthPoints: 2100, maxHealthPoints: 8000, currentEnergy: 0, maxEnergy: 10, deck: [], hand: [], graveyard: [], destroyedPile: [], activeEntities: [], activeExecutions: [] },
      playerB: { id: "p2", healthPoints: 2000, maxHealthPoints: 8000, currentEnergy: 0, maxEnergy: 10, deck: [], hand: [], graveyard: [], destroyedPile: [], activeEntities: [], activeExecutions: [] },
    });
    expect(resolveWinnerPlayerId(state)).toBe("p1");
  });

  it("si hay empate de LP al límite, pierde quien llegó antes a ese LP", () => {
    const state = createTestGameState({
      turn: 30,
      playerA: { id: "p1", healthPoints: 6000, maxHealthPoints: 8000, currentEnergy: 0, maxEnergy: 10, deck: [], hand: [], graveyard: [], destroyedPile: [], activeEntities: [], activeExecutions: [] },
      playerB: { id: "p2", healthPoints: 6000, maxHealthPoints: 8000, currentEnergy: 0, maxEnergy: 10, deck: [], hand: [], graveyard: [], destroyedPile: [], activeEntities: [], activeExecutions: [] },
      combatLog: [
        createLogEvent(1, "DIRECT_DAMAGE", "p1", 2000),
        createLogEvent(2, "DIRECT_DAMAGE", "p2", 2000),
      ],
    });
    expect(resolveWinnerPlayerId(state)).toBe("p2");
  });

  it("si ambos llegan al mismo LP al mismo tiempo, devuelve DRAW", () => {
    const state = createTestGameState({
      turn: 30,
      playerA: { id: "p1", healthPoints: 8000, maxHealthPoints: 8000, currentEnergy: 0, maxEnergy: 10, deck: [], hand: [], graveyard: [], destroyedPile: [], activeEntities: [], activeExecutions: [] },
      playerB: { id: "p2", healthPoints: 8000, maxHealthPoints: 8000, currentEnergy: 0, maxEnergy: 10, deck: [], hand: [], graveyard: [], destroyedPile: [], activeEntities: [], activeExecutions: [] },
    });
    expect(resolveWinnerPlayerId(state)).toBe("DRAW");
  });
});
