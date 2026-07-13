// src/core/use-cases/game-engine/combat/no-direct-attacks-status.integration.test.ts - Verifica el estado
// "sin ataques directos" (#5 Firewall Fortaleza) end-to-end: aplicación, bloqueo y expiración por turnos.
import { describe, expect, it } from "vitest";
import { ICard } from "@/core/entities/ICard";
import { IActiveStatusEffect } from "@/core/entities/IStatusEffect";
import { GameEngine } from "@/core/use-cases/GameEngine";
import { createDeckCard, createTestBoardEntity, createTestGameState } from "@/core/use-cases/game-engine/test-support/state-fixtures";

const firewall: ICard = {
  id: "exec-firewall-fortress",
  name: "Firewall Fortaleza",
  description: "",
  type: "EXECUTION",
  faction: "NEUTRAL",
  cost: 3,
  effect: { action: "APPLY_NO_DIRECT_ATTACKS", turns: 3 },
};

function blockedState(remaining: number) {
  const status: IActiveStatusEffect = { id: "NO_DIRECT_ATTACKS-p1-2", kind: "NO_DIRECT_ATTACKS", targetPlayerId: "p1", remainingTurns: remaining };
  return createTestGameState({
    activePlayerId: "p1",
    startingPlayerId: "p2",
    turn: 4,
    phase: "BATTLE",
    activeStatusEffects: [status],
    playerA: { activeEntities: [createTestBoardEntity("atk", createDeckCard("entity-x"), "ATTACK")] },
  });
}

describe("Estado sin ataques directos (Firewall Fortaleza)", () => {
  it("al activar la magia aplica el estado al rival", () => {
    const state = createTestGameState({
      activePlayerId: "p1",
      phase: "MAIN_1",
      playerA: { activeExecutions: [createTestBoardEntity("exec-1", firewall, "ACTIVATE")] },
    });
    const next = GameEngine.resolveExecution(state, "p1", "exec-1");
    expect(next.activeStatusEffects).toEqual([
      { id: "NO_DIRECT_ATTACKS-p2-1", kind: "NO_DIRECT_ATTACKS", targetPlayerId: "p2", remainingTurns: 3 },
    ]);
    expect(next.combatLog.some((event) => event.eventType === "STATUS_EFFECT_APPLIED")).toBe(true);
  });

  it("bloquea el ataque directo del jugador afectado", () => {
    expect(() => GameEngine.executeAttack(blockedState(3), "p1", "atk")).toThrow("ataques directos");
  });

  it("expira tras los turnos del jugador afectado (deja de bloquear)", () => {
    // remaining 1: al terminar el turno de p1, el estado se purga.
    const next = GameEngine.nextPhase(blockedState(1));
    expect((next.activeStatusEffects ?? []).length).toBe(0);
  });
});
