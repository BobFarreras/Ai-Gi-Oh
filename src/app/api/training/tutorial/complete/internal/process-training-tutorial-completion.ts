// src/app/api/training/tutorial/complete/internal/process-training-tutorial-completion.ts - Marca tutorial como completado en progreso global del jugador.
import { IPlayerProgressRepository } from "@/core/repositories/IPlayerProgressRepository";
import { GetOrCreatePlayerProgressUseCase } from "@/core/use-cases/player/GetOrCreatePlayerProgressUseCase";

interface IProcessTrainingTutorialCompletionInput {
  playerId: string;
  playerProgressRepository: IPlayerProgressRepository;
}

/**
 * Actualiza progreso global para desbloquear rutas que dependan de tutorial completado.
 */
export async function processTrainingTutorialCompletion(input: IProcessTrainingTutorialCompletionInput) {
  const progressUseCase = new GetOrCreatePlayerProgressUseCase(input.playerProgressRepository);
  await progressUseCase.execute({ playerId: input.playerId });
  const updated = await input.playerProgressRepository.update({
    playerId: input.playerId,
    hasCompletedTutorial: true,
  });
  return { hasCompletedTutorial: updated.hasCompletedTutorial };
}
