// src/core/entities/story/IPlayerStoryHistoryEvent.ts - Evento persistido del historial Story para trazabilidad del mapa narrativo.
export type StoryHistoryEventKind = "MOVE" | "NODE_RESOLVED" | "REWARD_GRANTED";

export interface IPlayerStoryHistoryEvent {
  eventId: string;
  playerId: string;
  nodeId: string;
  kind: StoryHistoryEventKind;
  details: string;
  createdAtIso: string;
}
