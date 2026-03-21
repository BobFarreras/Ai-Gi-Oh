// src/components/hub/onboarding/internal/resolve-onboarding-visibility.ts - Reglas puras de visibilidad del onboarding inicial del Hub.
import { IPlayerHubProgress } from "@/core/entities/hub/IPlayerHubProgress";

/**
 * Determina si el jugador todavía debe ver la secuencia de onboarding.
 */
export function resolveOnboardingVisibility(progress?: IPlayerHubProgress): boolean {
  return Boolean(progress && !progress.hasSeenAcademyIntro);
}
