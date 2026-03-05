// src/core/use-cases/player/GetOrCreatePlayerProgressUseCase.ts - Garantiza progreso base del jugador y lo devuelve para módulos de campaña/hub.
import { ValidationError } from "@/core/errors/ValidationError";
import { IPlayerProgress } from "@/core/entities/player/IPlayerProgress";
import { IPlayerProgressRepository } from "@/core/repositories/IPlayerProgressRepository";

interface IGetOrCreatePlayerProgressInput {
  playerId: string;
}

export class GetOrCreatePlayerProgressUseCase {
  constructor(private readonly progressRepository: IPlayerProgressRepository) {}

  async execute(input: IGetOrCreatePlayerProgressInput): Promise<IPlayerProgress> {
    if (!input.playerId.trim()) throw new ValidationError("El identificador del jugador es obligatorio.");
    const existingProgress = await this.progressRepository.getByPlayerId(input.playerId);
    if (existingProgress) return existingProgress;
    return this.progressRepository.create({
      playerId: input.playerId,
      hasCompletedTutorial: false,
      medals: 0,
      storyChapter: 1,
      updatedAtIso: new Date().toISOString(),
    });
  }
}
