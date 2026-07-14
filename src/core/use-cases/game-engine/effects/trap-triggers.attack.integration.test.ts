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
  trapFlutterReflect,
  trapMetasploitNegate,
  trapNegateAttack,
  trapOnAttack,
  trapTypescriptShield,
  typescriptEntity,
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

  it("no activa el counter-trap si el jugador lo rechaza (skipCounterTrapPlayerIds)", () => {
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
    // El atacante (p1) decide NO activar su Nullify: la trampa rival resuelve con normalidad.
    const next = GameEngine.executeAttack(state, "p1", "a-counter", undefined, { skipCounterTrapPlayerIds: ["p1"] });
    // La trampa rival golpea a p1 (no fue negada) y va al cementerio normal, no a destruidos.
    expect(next.playerA.healthPoints).toBe(7500);
    expect(next.playerB.graveyard.some((card) => card.id === "trap-on-attack")).toBe(true);
    expect((next.playerB.destroyedPile ?? []).some((card) => card.id === "trap-on-attack")).toBe(false);
    // El counter-trap del jugador se conserva sin usarse (sigue en su zona, no en cementerio).
    expect(next.playerA.activeExecutions.some((entity) => entity.card.id === "trap-counter-trap")).toBe(true);
    expect(next.playerA.graveyard.some((card) => card.id === "trap-counter-trap")).toBe(false);
  });

  it("Flutter Enjambre refleja el ataque directo al atacante y protege al dueño", () => {
    const base = createTrapBaseState();
    const state: GameState = {
      ...base,
      playerA: {
        ...base.playerA,
        activeEntities: [createTestBoardEntity("a-flutter", attackerCard, "ATTACK")],
      },
      playerB: {
        ...base.playerB,
        activeExecutions: [createTrapEntity("t-flutter", trapFlutterReflect)],
      },
    };
    const next = GameEngine.executeAttack(state, "p1", "a-flutter");
    // El atacante (p1) recibe el ATK reflejado (1600); el dueño de la trampa (p2) no recibe daño.
    expect(next.playerA.healthPoints).toBe(8000 - 1600);
    expect(next.playerB.healthPoints).toBe(8000);
    // El atacante queda marcado como usado y la trampa va al cementerio; la marca transitoria se limpia.
    expect(next.playerA.activeEntities.find((entity) => entity.instanceId === "a-flutter")?.hasAttackedThisTurn).toBe(true);
    expect(next.playerB.graveyard.some((card) => card.id === "trap-flutter-reflect")).toBe(true);
    expect(next.negatedAttackAttackerInstanceId).toBeUndefined();
    const reflectDamage = next.combatLog.find(
      (event) => event.eventType === "DIRECT_DAMAGE" && (event.payload as Record<string, unknown>).targetPlayerId === "p1",
    );
    expect(reflectDamage).toBeTruthy();
  });

  it("Escudo Metasploit bloquea el ataque a una entity sin destruir al atacante", () => {
    const base = createTrapBaseState();
    const defenderCard = { id: "def-card", name: "Defender", description: "", type: "ENTITY" as const, faction: "OPEN_SOURCE" as const, cost: 2, attack: 800, defense: 1200 };
    const state: GameState = {
      ...base,
      playerA: { ...base.playerA, activeEntities: [createTestBoardEntity("a-meta", attackerCard, "ATTACK")] },
      playerB: {
        ...base.playerB,
        activeEntities: [createTestBoardEntity("d-meta", defenderCard, "DEFENSE")],
        activeExecutions: [createTrapEntity("t-meta", trapMetasploitNegate)],
      },
    };
    const next = GameEngine.executeAttack(state, "p1", "a-meta", "d-meta");
    // Ni atacante ni defensor se destruyen; el atacante queda marcado como usado y la trampa al cementerio.
    expect(next.playerA.activeEntities.find((entity) => entity.instanceId === "a-meta")?.hasAttackedThisTurn).toBe(true);
    expect(next.playerB.activeEntities.some((entity) => entity.instanceId === "d-meta")).toBe(true);
    expect(next.playerB.graveyard.some((card) => card.id === "trap-escudo-metasploit")).toBe(true);
    expect(next.negatedAttackAttackerInstanceId).toBeUndefined();
  });

  it("Escudo Metasploit también bloquea un ataque directo (sin daño al dueño)", () => {
    const base = createTrapBaseState();
    const state: GameState = {
      ...base,
      playerA: { ...base.playerA, activeEntities: [createTestBoardEntity("a-meta2", attackerCard, "ATTACK")] },
      playerB: { ...base.playerB, activeExecutions: [createTrapEntity("t-meta2", trapMetasploitNegate)] },
    };
    const next = GameEngine.executeAttack(state, "p1", "a-meta2");
    expect(next.playerB.healthPoints).toBe(8000);
    expect(next.playerA.activeEntities.find((entity) => entity.instanceId === "a-meta2")?.hasAttackedThisTurn).toBe(true);
    expect(next.playerB.graveyard.some((card) => card.id === "trap-escudo-metasploit")).toBe(true);
  });

  it("Escudo TypeScript refuerza la entity ligada al ser atacada y la trampa persiste", () => {
    const base = createTrapBaseState();
    const state: GameState = {
      ...base,
      activePlayerId: "p2",
      playerA: {
        ...base.playerA,
        activeEntities: [createTestBoardEntity("ts", typescriptEntity, "DEFENSE")],
        activeExecutions: [createTrapEntity("shield", trapTypescriptShield)],
      },
      playerB: {
        ...base.playerB,
        activeEntities: [createTestBoardEntity("atk", attackerCard, "ATTACK")],
      },
    };
    const next = GameEngine.executeAttack(state, "p2", "atk", "ts");
    // +1000 DEF a la entity ligada (1000 -> 2000): sobrevive al ataque de 1600 ATK.
    const ts = next.playerA.activeEntities.find((entity) => entity.instanceId === "ts");
    expect(ts?.card.defense).toBe(2000);
    // La trampa NO se consume: sigue puesta (no está en el cementerio).
    expect(next.playerA.activeExecutions.some((entity) => entity.card.id === "trap-typescript-shield")).toBe(true);
    expect(next.playerA.graveyard.some((card) => card.id === "trap-typescript-shield")).toBe(false);
  });

  it("Escudo TypeScript NO se activa si el rival ataca a otra entity (no a la TypeScript)", () => {
    const base = createTrapBaseState();
    const otherCard = { id: "entity-otra", name: "Otra", description: "", type: "ENTITY" as const, faction: "NEUTRAL" as const, cost: 2, attack: 900, defense: 1800 };
    const state: GameState = {
      ...base,
      activePlayerId: "p2",
      playerA: {
        ...base.playerA,
        activeEntities: [createTestBoardEntity("ts", typescriptEntity, "DEFENSE"), createTestBoardEntity("otra", otherCard, "DEFENSE")],
        activeExecutions: [createTrapEntity("shield", trapTypescriptShield)],
      },
      playerB: {
        ...base.playerB,
        activeEntities: [createTestBoardEntity("atk", attackerCard, "ATTACK")],
      },
    };
    const next = GameEngine.executeAttack(state, "p2", "atk", "otra"); // ataca a la OTRA, no a la TypeScript
    // La TypeScript no se refuerza y la trampa no se dispara (sigue puesta, sin TRAP_TRIGGERED del escudo).
    expect(next.playerA.activeEntities.find((entity) => entity.instanceId === "ts")?.card.defense).toBe(1000);
    expect(next.playerA.activeExecutions.some((entity) => entity.card.id === "trap-typescript-shield")).toBe(true);
    const shieldTriggered = next.combatLog.some(
      (event) => event.eventType === "TRAP_TRIGGERED" && (event.payload as Record<string, unknown>).trapCardId === "trap-typescript-shield",
    );
    expect(shieldTriggered).toBe(false);
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
