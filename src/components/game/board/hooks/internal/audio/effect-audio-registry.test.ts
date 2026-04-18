// src/components/game/board/hooks/internal/audio/effect-audio-registry.test.ts - Verifica resolución de audio para acciones con override y rutas dinámicas.
import { describe, expect, it } from "vitest";
import { ICombatLogEvent } from "@/core/entities/ICombatLog";
import { resolveEffectAudioPath } from "./effect-audio-registry";

function createCombatLogEvent(input: {
  eventType: ICombatLogEvent["eventType"];
  payload: Record<string, unknown>;
}): ICombatLogEvent {
  return {
    id: "log-1",
    turn: 1,
    phase: "MAIN_1",
    actorPlayerId: "player-1",
    eventType: input.eventType,
    payload: input.payload,
    timestamp: "2026-01-01T00:00:00.000Z",
  };
}

describe("resolveEffectAudioPath", () => {
  it("usa override estable para FUSION_SUMMON", () => {
    const event = createCombatLogEvent({
      eventType: "CARD_PLAYED",
      payload: {
        cardType: "EXECUTION",
        mode: "ACTIVATE",
        effectAction: "FUSION_SUMMON",
      },
    });
    expect(resolveEffectAudioPath(event)).toBe("/audio/sfx/fusion-summon.mp3");
  });

  it("usa override de DAMAGE para evitar rutas trap inexistentes", () => {
    const event = createCombatLogEvent({
      eventType: "TRAP_TRIGGERED",
      payload: {
        effectAction: "DAMAGE",
      },
    });
    expect(resolveEffectAudioPath(event)).toBe("/audio/sfx/effects/execution/damage.mp3");
  });

  it("mantiene resolución dinámica snake_case para acciones sin override", () => {
    const event = createCombatLogEvent({
      eventType: "CARD_PLAYED",
      payload: {
        cardType: "EXECUTION",
        mode: "ACTIVATE",
        effectAction: "DRAW_CARD",
      },
    });
    expect(resolveEffectAudioPath(event)).toBe("/audio/sfx/effects/execution/draw_card.mp3");
  });
});
