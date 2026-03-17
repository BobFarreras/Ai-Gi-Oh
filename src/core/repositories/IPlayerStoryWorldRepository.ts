// src/core/repositories/IPlayerStoryWorldRepository.ts - Contrato de persistencia para estado compacto de navegación Story del jugador.
import { IPlayerStoryWorldCompactState } from "@/core/entities/story/IPlayerStoryWorldCompactState";

export interface IPlayerStoryWorldRepository {
  getCurrentNodeIdByPlayerId: (playerId: string) => Promise<string | null>;
  saveCurrentNodeId: (playerId: string, currentNodeId: string | null) => Promise<void>;
  getCompactStateByPlayerId: (playerId: string) => Promise<IPlayerStoryWorldCompactState>;
  saveCompactStateByPlayerId: (
    playerId: string,
    state: IPlayerStoryWorldCompactState,
  ) => Promise<void>;
}
