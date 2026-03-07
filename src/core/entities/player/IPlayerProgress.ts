// src/core/entities/player/IPlayerProgress.ts - Define progreso global del jugador para desbloqueos de módulos y campaña.
export interface IPlayerProgress {
  playerId: string;
  hasCompletedTutorial: boolean;
  medals: number;
  storyChapter: number;
  playerExperience: number;
  updatedAtIso: string;
}
