// src/services/story/should-append-story-move-event.ts - Decide si se debe registrar un nuevo evento MOVE en historial Story.
import { IPlayerStoryHistoryEvent } from "@/core/entities/story/IPlayerStoryHistoryEvent";

/**
 * Evita eventos MOVE duplicados consecutivos hacia el mismo nodo para controlar crecimiento de historial.
 */
export function shouldAppendStoryMoveEvent(input: {
  history: IPlayerStoryHistoryEvent[];
  targetNodeId: string;
}): boolean {
  const latestEvent = input.history[0];
  if (!latestEvent) return true;
  if (latestEvent.kind !== "MOVE") return true;
  return latestEvent.nodeId !== input.targetNodeId;
}
