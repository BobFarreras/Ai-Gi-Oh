// src/core/repositories/IPlayerStoryWorldRepository.ts - Contrato de persistencia para estado compacto de navegación Story del jugador.
import { IPlayerStoryWorldCompactState } from "@/core/entities/story/IPlayerStoryWorldCompactState";
import {
  IPlayerOverworldState,
  ISaveOverworldStateInput,
} from "@/core/entities/story/IPlayerOverworldState";

export interface IPlayerStoryWorldRepository {
  getCurrentNodeIdByPlayerId: (playerId: string) => Promise<string | null>;
  saveCurrentNodeId: (playerId: string, currentNodeId: string | null) => Promise<void>;
  getCompactStateByPlayerId: (playerId: string) => Promise<IPlayerStoryWorldCompactState>;
  saveCompactStateByPlayerId: (
    playerId: string,
    state: IPlayerStoryWorldCompactState,
  ) => Promise<void>;
  getOverworldStateByPlayerId: (playerId: string) => Promise<IPlayerOverworldState>;
  saveOverworldState: (playerId: string, input: ISaveOverworldStateInput) => Promise<void>;
}
