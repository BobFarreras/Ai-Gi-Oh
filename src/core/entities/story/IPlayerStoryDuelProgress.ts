// src/core/entities/story/IPlayerStoryDuelProgress.ts - Representa progreso del jugador por duelo Story para bloqueos y recompensas.
export type StoryDuelBestResult = "NOT_PLAYED" | "LOST" | "WON";

export interface IPlayerStoryDuelProgress {
  playerId: string;
  duelId: string;
  wins: number;
  losses: number;
  bestResult: StoryDuelBestResult;
  firstClearedAtIso: string | null;
  lastPlayedAtIso: string | null;
  updatedAtIso: string;
}
