// src/core/use-cases/game-engine/effects/trap-triggers.attack.integration.test.ts - Pruebas de trampas disparadas por ataques y su resolución final.
import { describe, expect, it } from "vitest";
import { GameEngine, GameState } from "@/core/use-cases/GameEngine";
import { createTestBoardEntity } from "@/core/use-cases/game-engine/test-support/state-fixtures";
import {
  attackerCard,
  createTrapBaseState,
  createTrapEntity,
  trapCounterTrap,
  trapDrainDirectAttackerEnergy,
  trapNegateAttack,
  trapOnAttack,
} from "@/core/use-cases/game-engine/effects/trap-triggers.test-fixtures";

describe("Trap triggers on attack", () => {
  it("debería disparar trampa al declarar ataque y enviarla al cementerio", () => {
    const base = createTrapBaseState();
    const state: GameState = {
      ...base,
      playerA: {
        ...base.playerA,
        activeEntities: [createTestBoardEntity("a1", attackerCard, "ATTACK")],
      },
      playerB: {
        ...base.playerB,
        activeExecutions: [createTrapEntity("t1", trapOnAttack)],
      },
    };

    const next = GameEngine.executeAttack(state, "p1", "a1");
    expect(next.playerA.healthPoints).toBe(7500);
    expect(next.playerB.activeExecutions).toHaveLength(0);
    expect(next.playerB.graveyard.some((card) => card.id === "trap-on-attack")).toBe(true);
    expect(next.combatLog.some((event) => event.eventType === "TRAP_TRIGGERED")).toBe(true);
    const trapTriggeredIndex = next.combatLog.findIndex((event) => event.eventType === "TRAP_TRIGGERED");
    const directDamageIndex = next.combatLog.findIndex((event) => event.eventType === "DIRECT_DAMAGE");
    const trapToGraveyardIndex = next.combatLog.findIndex(
      (event) =>
        event.eventType === "CARD_TO_GRAVEYARD" &&
        typeof event.payload === "object" &&
        event.payload !== null &&
        (event.payload as Record<string, unknown>).cardId === "trap-on-attack",
    );
    expect(trapTriggeredIndex).toBeGreaterThanOrEqual(0);
    expect(directDamageIndex).toBeGreaterThan(trapTriggeredIndex);
    expect(trapToGraveyardIndex).toBeGreaterThan(directDamageIndex);
  });

  it("debería anular ataque y destruir atacante con trampa de negación", () => {
    const base = createTrapBaseState();
    const state: GameState = {
      ...base,
      playerA: {
        ...base.playerA,
        activeEntities: [createTestBoardEntity("a-neg", attackerCard, "ATTACK")],
      },
      playerB: {
        ...base.playerB,
        activeExecutions: [createTrapEntity("t-neg", trapNegateAttack)],
      },
    };

    const next = GameEngine.executeAttack(state, "p1", "a-neg");
    expect(next.playerA.activeEntities).toHaveLength(0);
    expect((next.playerA.destroyedPile ?? []).some((card) => card.id === "atk-card")).toBe(true);
    expect(next.playerA.graveyard.some((card) => card.id === "atk-card")).toBe(false);
    expect(next.playerB.healthPoints).toBe(8000);
    expect(next.combatLog.some((event) => event.eventType === "TRAP_TRIGGERED")).toBe(true);
    const trapTriggered = next.combatLog.find((event) => event.eventType === "TRAP_TRIGGERED");
    expect(
      typeof trapTriggered?.payload === "object" &&
      trapTriggered.payload !== null &&
      (trapTriggered.payload as Record<string, unknown>).destroyedOpponentEntitySlotIndex === 0,
    ).toBe(true);
  });

  it("debería negar trampa rival y destruirla con counter-trap", () => {
    const base = createTrapBaseState();
    const state: GameState = {
      ...base,
      playerA: {
        ...base.playerA,
        activeEntities: [createTestBoardEntity("a-counter", attackerCard, "ATTACK")],
        activeExecutions: [createTrapEntity("counter", trapCounterTrap)],
      },
      playerB: {
        ...base.playerB,
        activeExecutions: [createTrapEntity("trap-source", trapOnAttack)],
      },
    };
    const next = GameEngine.executeAttack(state, "p1", "a-counter");
    expect(next.playerA.healthPoints).toBe(8000);
    expect(next.playerB.healthPoints).toBe(6400);
    expect(next.playerA.graveyard.some((card) => card.id === "trap-counter-trap")).toBe(true);
    expect((next.playerB.destroyedPile ?? []).some((card) => card.id === "trap-on-attack")).toBe(true);
    expect(next.playerB.graveyard.some((card) => card.id === "trap-on-attack")).toBe(false);
    const trapTriggeredIndex = next.combatLog.findIndex((event) => event.eventType === "TRAP_TRIGGERED");
    const destroyedIndex = next.combatLog.findIndex((event) => event.eventType === "CARD_TO_DESTROYED");
    const counterToGraveyardIndex = next.combatLog.findIndex(
      (event) =>
        event.eventType === "CARD_TO_GRAVEYARD" &&
        typeof event.payload === "object" &&
        event.payload !== null &&
        (event.payload as Record<string, unknown>).cardId === "trap-counter-trap",
    );
    expect(trapTriggeredIndex).toBeGreaterThanOrEqual(0);
    expect(destroyedIndex).toBeGreaterThan(trapTriggeredIndex);
    expect(counterToGraveyardIndex).toBeGreaterThan(destroyedIndex);
  });

  it("debería drenar energía del atacante y fijar energía del defensor a 10 en ataque directo", () => {
    const base = createTrapBaseState();
    const state: GameState = {
      ...base,
      playerA: {
        ...base.playerA,
        currentEnergy: 4,
        activeEntities: [createTestBoardEntity("a-direct", attackerCard, "ATTACK")],
      },
      playerB: {
        ...base.playerB,
        currentEnergy: 2,
        activeExecutions: [createTrapEntity("t-direct", trapDrainDirectAttackerEnergy)],
      },
    };
    const next = GameEngine.executeAttack(state, "p1", "a-direct");
    expect(next.playerA.currentEnergy).toBe(0);
    expect(next.playerB.currentEnergy).toBe(10);
  });
});
