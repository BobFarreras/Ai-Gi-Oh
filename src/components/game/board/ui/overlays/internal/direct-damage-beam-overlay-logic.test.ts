// src/components/game/board/ui/overlays/internal/direct-damage-beam-overlay-logic.test.ts - Valida detección de daño por efecto para no confundir trampas con daño de ataque directo.
import { describe, expect, it } from "vitest";
import { ICombatLogEvent } from "@/core/entities/ICombatLog";
import { resolveLatestEffectDamageSignal } from "./direct-damage-beam-overlay-logic";

function event(overrides: Partial<ICombatLogEvent>): ICombatLogEvent {
  return {
    id: overrides.id ?? "evt",
    turn: overrides.turn ?? 1,
    phase: overrides.phase ?? "BATTLE",
    actorPlayerId: overrides.actorPlayerId ?? "p1",
    eventType: overrides.eventType ?? "ATTACK_DECLARED",
    payload: overrides.payload ?? {},
    timestamp: overrides.timestamp ?? new Date(0).toISOString(),
  };
}

describe("resolveLatestEffectDamageSignal", () => {
  it("detecta daño de trampa aunque ocurra en secuencia de ATTACK_DECLARED", () => {
    const events: ICombatLogEvent[] = [
      event({ id: "a1", eventType: "ATTACK_DECLARED", actorPlayerId: "p1" }),
      event({
        id: "t1",
        eventType: "TRAP_TRIGGERED",
        actorPlayerId: "p2",
        payload: { trapCardId: "trap-counter-intrusion", effectAction: "DAMAGE" },
      }),
      event({
        id: "d1",
        eventType: "DIRECT_DAMAGE",
        actorPlayerId: "p2",
        payload: { targetPlayerId: "p1", amount: 500 },
      }),
    ];

    const signal = resolveLatestEffectDamageSignal(events, "p1");
    expect(signal).not.toBeNull();
    expect(signal?.fromPlayerA).toBe(false);
    expect(signal?.towardsPlayer).toBe(true);
    expect(signal?.sourceCardId).toBe("trap-counter-intrusion");
  });

  it("ignora daño directo originado por ataque normal", () => {
    const events: ICombatLogEvent[] = [
      event({ id: "a1", eventType: "ATTACK_DECLARED", actorPlayerId: "p1" }),
      event({
        id: "d1",
        eventType: "DIRECT_DAMAGE",
        actorPlayerId: "p1",
        payload: { targetPlayerId: "p2", amount: 1200 },
      }),
    ];

    const signal = resolveLatestEffectDamageSignal(events, "p1");
    expect(signal).toBeNull();
  });

  it("si hay daño de ataque después, mantiene la animación del daño de trampa anterior", () => {
    const events: ICombatLogEvent[] = [
      event({ id: "a1", eventType: "ATTACK_DECLARED", actorPlayerId: "p1" }),
      event({
        id: "t1",
        eventType: "TRAP_TRIGGERED",
        actorPlayerId: "p2",
        payload: { trapCardId: "trap-counter-intrusion", effectAction: "DAMAGE" },
      }),
      event({
        id: "d-trap",
        eventType: "DIRECT_DAMAGE",
        actorPlayerId: "p2",
        payload: { targetPlayerId: "p1", amount: 500 },
      }),
      event({
        id: "d-attack",
        eventType: "DIRECT_DAMAGE",
        actorPlayerId: "p1",
        payload: { targetPlayerId: "p2", amount: 1200 },
      }),
    ];

    const signal = resolveLatestEffectDamageSignal(events, "p1");
    expect(signal).not.toBeNull();
    expect(signal?.id).toBe("d-trap");
    expect(signal?.sourceCardId).toBe("trap-counter-intrusion");
  });
});
