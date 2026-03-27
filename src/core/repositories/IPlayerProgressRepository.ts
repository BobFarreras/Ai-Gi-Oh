// src/core/repositories/IPlayerProgressRepository.ts - Contrato para persistir progreso del jugador para hub/campaña.
import { IPlayerProgress } from "@/core/entities/player/IPlayerProgress";

export interface IUpdatePlayerProgressInput {
  playerId: string;
  hasCompletedTutorial?: boolean;
  hasSeenAcademyIntro?: boolean;
  hasSkippedTutorial?: boolean;
  medals?: number;
  storyChapter?: number;
  playerExperience?: number;
}

export interface IPlayerProgressRepository {
  getByPlayerId(playerId: string): Promise<IPlayerProgress | null>;
  create(progress: IPlayerProgress): Promise<IPlayerProgress>;
  update(input: IUpdatePlayerProgressInput): Promise<IPlayerProgress>;
}
