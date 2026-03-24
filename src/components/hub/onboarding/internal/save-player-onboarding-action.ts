// src/components/hub/onboarding/internal/save-player-onboarding-action.ts - Cliente HTTP para persistir decisiones de onboarding en Hub.
import { ValidationError } from "@/core/errors/ValidationError";

export type PlayerOnboardingAction = "mark_intro_seen" | "skip_tutorial";

/**
 * Envía acción de onboarding al backend y valida respuesta HTTP.
 */
export async function savePlayerOnboardingAction(action: PlayerOnboardingAction): Promise<void> {
  const response = await fetch("/api/player/onboarding", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action }),
  });
  if (!response.ok) {
    throw new ValidationError("No se pudo guardar el estado de onboarding.");
  }
}
