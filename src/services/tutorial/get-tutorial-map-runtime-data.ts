// src/services/tutorial/get-tutorial-map-runtime-data.ts - Carga estado del mapa tutorial desde sesión y progreso persistente.
import { GetTutorialMapStateUseCase } from "@/core/use-cases/tutorial/GetTutorialMapStateUseCase";
import { createSupabaseTutorialNodeProgressRepository } from "@/infrastructure/persistence/supabase/create-supabase-tutorial-node-progress-repository";
import { getCurrentUserSession } from "@/services/auth/get-current-user-session";

export async function getTutorialMapRuntimeData() {
  const session = await getCurrentUserSession();
  const useCase = new GetTutorialMapStateUseCase();
  if (!session?.user.id) return useCase.execute({ completedNodeIds: [] });
  const tutorialNodeRepository = await createSupabaseTutorialNodeProgressRepository();
  const completedNodeIds = await tutorialNodeRepository.listCompletedNodeIds(session.user.id);
  return useCase.execute({ completedNodeIds });
}
