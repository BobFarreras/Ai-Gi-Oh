// src/services/training/get-training-arena-runtime-data.ts - Carga estado server-side de arena training con progreso, tiers y mazo jugador.
import { GetTrainingArenaStateUseCase } from "@/core/use-cases/training/GetTrainingArenaStateUseCase";
import { createInitialTrainingProgress, resolveTrainingTierCatalog } from "@/core/services/training/resolve-training-tier-catalog";
import { createSupabaseTrainingProgressRepository } from "@/infrastructure/persistence/supabase/create-supabase-training-progress-repository";
import { getArenaCatalog } from "@/services/training/get-arena-catalog";
import { getCurrentUserSession } from "@/services/auth/get-current-user-session";
import { getPlayerBoardLoadout } from "@/services/game/get-player-board-deck";
import { getPlayerDisplayName } from "@/services/player-profile/get-player-display-name";

export async function getTrainingArenaRuntimeData(selectedTier: number) {
  const [session, loadout, arenaCatalog] = await Promise.all([getCurrentUserSession(), getPlayerBoardLoadout(), getArenaCatalog()]);
  const playerId = session?.user.id ?? "local-player";
  const playerDisplayName = await getPlayerDisplayName(session, "Arquitecto");
  // Tiers desde BD si existen; si no, catálogo en código (sin cambio de comportamiento).
  const catalog = resolveTrainingTierCatalog(arenaCatalog.tiers ? { tiers: arenaCatalog.tiers } : undefined);
  if (!session?.user.id) {
    const progress = createInitialTrainingProgress("local-player");
    const state = new GetTrainingArenaStateUseCase().execute({
      progress,
      selectedTier,
      catalog,
    });
    return { loadout, progress, playerId, playerDisplayName, arenaOpponents: arenaCatalog.opponents, ...state };
  }
  const trainingRepository = await createSupabaseTrainingProgressRepository();
  const progress = (await trainingRepository.getByPlayerId(session.user.id)) ?? createInitialTrainingProgress(session.user.id);
  const state = new GetTrainingArenaStateUseCase().execute({ progress, selectedTier, catalog });
  return { loadout, progress, playerId, playerDisplayName, arenaOpponents: arenaCatalog.opponents, ...state };
}
