// src/app/api/player/onboarding/internal/process-player-onboarding-action.ts - Procesa acciones de onboarding del hub de forma tipada e idempotente.
import { ValidationError } from "@/core/errors/ValidationError";
import { IPlayerProgressRepository } from "@/core/repositories/IPlayerProgressRepository";

export type PlayerOnboardingAction = "mark_intro_seen" | "skip_tutorial";

interface IProcessPlayerOnboardingActionInput {
  playerId: string;
  action: PlayerOnboardingAction;
  progressRepository: IPlayerProgressRepository;
}

/**
 * Persiste las decisiones de onboarding para controlar bloqueos iniciales del Hub.
 */
export async function processPlayerOnboardingAction(input: IProcessPlayerOnboardingActionInput) {
  if (!input.playerId.trim()) {
    throw new ValidationError("El identificador del jugador es obligatorio.");
  }
  if (input.action === "mark_intro_seen") {
    return input.progressRepository.update({
      playerId: input.playerId,
      hasSeenAcademyIntro: true,
    });
  }
  if (input.action === "skip_tutorial") {
    return input.progressRepository.update({
      playerId: input.playerId,
      hasSeenAcademyIntro: true,
      hasSkippedTutorial: true,
    });
  }
  throw new ValidationError("Acción de onboarding no soportada.");
}
