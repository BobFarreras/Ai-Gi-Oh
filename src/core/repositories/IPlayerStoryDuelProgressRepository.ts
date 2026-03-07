// src/core/repositories/IPlayerStoryDuelProgressRepository.ts - Contrato de persistencia del progreso por duelo Story del jugador.
import { IPlayerStoryDuelProgress } from "@/core/entities/story/IPlayerStoryDuelProgress";

export interface IPlayerStoryDuelProgressRepository {
  listByPlayerId: (playerId: string) => Promise<IPlayerStoryDuelProgress[]>;
  getByPlayerAndDuelId: (playerId: string, duelId: string) => Promise<IPlayerStoryDuelProgress | null>;
  registerDuelResult: (playerId: string, duelId: string, didWin: boolean) => Promise<IPlayerStoryDuelProgress>;
}
