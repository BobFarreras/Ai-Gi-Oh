// src/core/entities/hub/IPlayerHubProgress.ts - Define el progreso del jugador usado para desbloquear secciones del hub.
export interface IPlayerHubProgress {
  playerId: string;
  medals: number;
  storyChapter: number;
  hasCompletedTutorial: boolean;
}
