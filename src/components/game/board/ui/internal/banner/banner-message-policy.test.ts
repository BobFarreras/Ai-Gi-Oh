// src/components/game/board/ui/internal/banner/banner-message-policy.test.ts - Pruebas de política latest-wins para evitar cola atrasada de banners del combate.
import { describe, expect, it } from "vitest";
import { ICombatLogEvent } from "@/core/entities/ICombatLog";
import { resolveLatestBannerMessage } from "./banner-message-policy";

function createEvent(id: string, eventType: ICombatLogEvent["eventType"]): ICombatLogEvent {
  return {
    id,
    turn: 1,
    phase: "MAIN_1",
    actorPlayerId: "p1",
    eventType,
    payload: {},
    timestamp: "2026-03-08T00:00:00.000Z",
  };
}

const labels = { playerAId: "p1", playerAName: "A", playerBId: "p2", playerBName: "B" };

describe("resolveLatestBannerMessage", () => {
  it("devuelve solo el último evento crítico cuando entran varios", () => {
    const result = resolveLatestBannerMessage({
      events: [createEvent("1", "TURN_STARTED"), createEvent("2", "PHASE_CHANGED"), createEvent("3", "AUTO_PHASE_ADVANCED")],
      labels,
    });
    expect(result?.id).toBe("3");
  });

  it("prioriza señal externa si llega junto a eventos del motor", () => {
    const result = resolveLatestBannerMessage({
      events: [createEvent("1", "TURN_STARTED"), createEvent("2", "PHASE_CHANGED")],
      labels,
      externalBannerSignal: { id: "external-1", left: "Modo", right: "Automático" },
    });
    expect(result?.id).toBe("external-1");
  });

  it("retorna null cuando no hay mensajes críticos", () => {
    const result = resolveLatestBannerMessage({ events: [createEvent("1", "CARD_PLAYED")], labels });
    expect(result).toBeNull();
  });
});

