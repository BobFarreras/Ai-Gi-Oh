// src/services/hub/get-onboarding-completed.ts - Servicio server-side: si el jugador ya pasó el onboarding (completó o saltó el tutorial). Se usa para no mostrar el dock/recompensa diaria durante la narración inicial ni el tutorial.
import { GetOrCreatePlayerProgressUseCase } from "@/core/use-cases/player/GetOrCreatePlayerProgressUseCase";
import { createSupabasePlayerProgressRepository } from "@/infrastructure/persistence/supabase/create-supabase-player-progress-repository";
import { getCurrentUserSession } from "@/services/auth/get-current-user-session";

/** True si el jugador ya completó o saltó el tutorial (es decir, ya está en el hub "real"). */
export async function getOnboardingCompleted(): Promise<boolean> {
  const session = await getCurrentUserSession();
  if (!session?.user.id) return false;
  const progressRepository = await createSupabasePlayerProgressRepository();
  const progress = await new GetOrCreatePlayerProgressUseCase(progressRepository).execute({ playerId: session.user.id });
  return Boolean(progress.hasCompletedTutorial || progress.hasSkippedTutorial);
}
