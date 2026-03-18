// src/services/tutorial/get-tutorial-map-runtime-data.ts - Carga estado del mapa tutorial desde sesión y progreso persistente.
import { GetTutorialMapStateUseCase } from "@/core/use-cases/tutorial/GetTutorialMapStateUseCase";
import { createSupabasePlayerProgressRepository } from "@/infrastructure/persistence/supabase/create-supabase-player-progress-repository";
import { createSupabaseTutorialNodeProgressRepository } from "@/infrastructure/persistence/supabase/create-supabase-tutorial-node-progress-repository";
import { getCurrentUserSession } from "@/services/auth/get-current-user-session";

export async function getTutorialMapRuntimeData() {
  const session = await getCurrentUserSession();
  const useCase = new GetTutorialMapStateUseCase();
  if (!session?.user.id) return useCase.execute({ hasCompletedLegacyTutorial: false, completedNodeIds: [] });
  const repository = await createSupabasePlayerProgressRepository();
  const tutorialNodeRepository = await createSupabaseTutorialNodeProgressRepository();
  const progress = await repository.getByPlayerId(session.user.id);
  const completedNodeIds = await tutorialNodeRepository.listCompletedNodeIds(session.user.id);
  return useCase.execute({
    hasCompletedLegacyTutorial: Boolean(progress?.hasCompletedTutorial),
    completedNodeIds,
  });
}
