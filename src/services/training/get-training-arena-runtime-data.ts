// src/services/training/get-training-arena-runtime-data.ts - Carga estado server-side de arena training con progreso, tiers y mazo jugador.
import { GetTrainingArenaStateUseCase } from "@/core/use-cases/training/GetTrainingArenaStateUseCase";
import { createInitialTrainingProgress, resolveTrainingTierCatalog } from "@/core/services/training/resolve-training-tier-catalog";
import { createSupabaseTrainingProgressRepository } from "@/infrastructure/persistence/supabase/create-supabase-training-progress-repository";
import { getCurrentUserSession } from "@/services/auth/get-current-user-session";
import { getPlayerBoardLoadout } from "@/services/game/get-player-board-deck";

export async function getTrainingArenaRuntimeData(selectedTier: number) {
  const [session, loadout] = await Promise.all([getCurrentUserSession(), getPlayerBoardLoadout()]);
  const catalog = resolveTrainingTierCatalog();
  if (!session?.user.id) {
    const progress = createInitialTrainingProgress("local-player");
    const state = new GetTrainingArenaStateUseCase().execute({
      progress,
      selectedTier,
      catalog,
    });
    return { loadout, progress, ...state };
  }
  const trainingRepository = await createSupabaseTrainingProgressRepository();
  const progress = (await trainingRepository.getByPlayerId(session.user.id)) ?? createInitialTrainingProgress(session.user.id);
  const state = new GetTrainingArenaStateUseCase().execute({ progress, selectedTier, catalog });
  return { loadout, progress, ...state };
}
