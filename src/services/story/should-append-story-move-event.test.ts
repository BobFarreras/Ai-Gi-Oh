// src/services/story/should-append-story-move-event.test.ts - Verifica deduplicación de eventos MOVE consecutivos en Story.
import { describe, expect, it } from "vitest";
import { shouldAppendStoryMoveEvent } from "@/services/story/should-append-story-move-event";
import { IPlayerStoryHistoryEvent } from "@/core/entities/story/IPlayerStoryHistoryEvent";

function createEvent(overrides: Partial<IPlayerStoryHistoryEvent>): IPlayerStoryHistoryEvent {
  return {
    eventId: "event-1",
    playerId: "player-1",
    nodeId: "story-ch1-player-start",
    kind: "MOVE",
    details: "Movimiento.",
    createdAtIso: "2026-03-11T10:00:00.000Z",
    ...overrides,
  };
}

describe("shouldAppendStoryMoveEvent", () => {
  it("bloquea duplicado consecutivo al mismo nodo", () => {
    const canAppend = shouldAppendStoryMoveEvent({
      history: [createEvent({ nodeId: "story-ch1-path-blank-1", kind: "MOVE" })],
      targetNodeId: "story-ch1-path-blank-1",
    });
    expect(canAppend).toBe(false);
  });

  it("permite registro cuando cambia el nodo destino", () => {
    const canAppend = shouldAppendStoryMoveEvent({
      history: [createEvent({ nodeId: "story-ch1-path-blank-1", kind: "MOVE" })],
      targetNodeId: "story-ch1-player-start",
    });
    expect(canAppend).toBe(true);
  });
});
