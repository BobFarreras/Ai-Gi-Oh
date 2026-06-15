// src/components/game/board/hooks/internal/board-state/boardCombatFeedback.test.ts - Verifica que el feedback de combate extrae siempre el último evento de cada tipo.
import { describe, expect, it } from "vitest";
import { ICombatLogEvent } from "@/core/entities/ICombatLog";
import { buildBoardCombatFeedback } from "./boardCombatFeedback";

/** Crea un evento mínimo del combatLog con payload arbitrario. */
function createEvent(
  id: string,
  eventType: ICombatLogEvent["eventType"],
  payload: Record<string, unknown>,
  actorPlayerId = "player-a",
): ICombatLogEvent {
  return { id, turn: 1, phase: "MAIN_1", actorPlayerId, eventType, payload, timestamp: "2026-06-11T00:00:00.000Z" };
}

describe("buildBoardCombatFeedback", () => {
  it("devuelve feedback vacío con log vacío", () => {
    const feedback = buildBoardCombatFeedback([]);
    expect(feedback.lastDamageEventId).toBeNull();
    expect(feedback.lastHealEventId).toBeNull();
    expect(feedback.lastBuffTargetEntityIds).toEqual([]);
  });

  it("extrae el último evento de cada tipo aunque haya varios", () => {
    const events: ICombatLogEvent[] = [
      createEvent("dmg-1", "DIRECT_DAMAGE", { targetPlayerId: "player-b", amount: 100 }),
      createEvent("heal-1", "HEAL_APPLIED", { targetPlayerId: "player-a", amount: 200 }),
      createEvent("dmg-2", "DIRECT_DAMAGE", { targetPlayerId: "player-a", amount: 350 }),
      createEvent("energy-1", "ENERGY_GAINED", { amount: 2 }),
      createEvent("buff-1", "STAT_BUFF_APPLIED", { targetEntityIds: ["entity-1"], stat: "ATTACK", amount: 300 }),
    ];

    const feedback = buildBoardCombatFeedback(events);

    expect(feedback.lastDamageEventId).toBe("dmg-2");
    expect(feedback.lastDamageTargetPlayerId).toBe("player-a");
    expect(feedback.lastDamageAmount).toBe(350);
    expect(feedback.lastHealEventId).toBe("heal-1");
    expect(feedback.lastEnergyEventId).toBe("energy-1");
    expect(feedback.lastBuffEventId).toBe("buff-1");
    expect(feedback.lastBuffTargetEntityIds).toEqual(["entity-1"]);
  });

  it("resuelve XP de carta desde el evento más reciente aplicable", () => {
    const events: ICombatLogEvent[] = [
      createEvent("played-1", "CARD_PLAYED", { cardId: "card-1", cardType: "ENTITY" }),
      createEvent("xp-1", "CARD_XP_GAINED", { cardId: "card-2", amount: 25 }),
    ];

    const feedback = buildBoardCombatFeedback(events);

    expect(feedback.lastCardXpCardId).toBe("card-2");
    expect(feedback.lastCardXpAmount).toBe(25);
    expect(feedback.lastCardXpEventId).toBe("xp-1");
  });

  it("ignora eventos sin tipo relevante", () => {
    const events: ICombatLogEvent[] = [
      createEvent("turn-1", "TURN_STARTED", {}),
      createEvent("phase-1", "PHASE_CHANGED", {}),
    ];

    const feedback = buildBoardCombatFeedback(events);

    expect(feedback.lastDamageEventId).toBeNull();
    expect(feedback.lastCardXpCardId).toBeNull();
  });
});
