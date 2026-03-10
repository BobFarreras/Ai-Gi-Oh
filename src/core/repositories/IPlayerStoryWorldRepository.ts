// src/core/repositories/IPlayerStoryWorldRepository.ts - Contrato de persistencia para estado de nodo actual e historial Story del jugador.
import { IPlayerStoryHistoryEvent } from "@/core/entities/story/IPlayerStoryHistoryEvent";

export interface IPlayerStoryWorldRepository {
  getCurrentNodeIdByPlayerId: (playerId: string) => Promise<string | null>;
  saveCurrentNodeId: (playerId: string, currentNodeId: string | null) => Promise<void>;
  listHistoryByPlayerId: (playerId: string, limit?: number) => Promise<IPlayerStoryHistoryEvent[]>;
  appendHistoryEvents: (playerId: string, events: IPlayerStoryHistoryEvent[]) => Promise<void>;
}
