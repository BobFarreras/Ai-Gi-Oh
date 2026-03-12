// src/core/use-cases/story/CommitStoryProgressUseCase.ts - Persiste el cursor Story proyectado del jugador.
import { IPlayerStoryWorldRepository } from "@/core/repositories/IPlayerStoryWorldRepository";
import { IStoryWorldProgressState } from "@/core/services/story/world/story-world-types";

interface ICommitStoryProgressInput {
  playerId: string;
  progress: IStoryWorldProgressState;
}

export class CommitStoryProgressUseCase {
  constructor(private readonly storyWorldRepository: IPlayerStoryWorldRepository) {}

  /**
   * Guarda el nodo actual generado por la lógica Story sin acoplar UI/infra.
   */
  async execute(input: ICommitStoryProgressInput): Promise<void> {
    await this.storyWorldRepository.saveCurrentNodeId(input.playerId, input.progress.currentNodeId);
  }
}
