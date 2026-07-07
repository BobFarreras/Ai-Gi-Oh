// src/services/story/overworld/get-story-overworld-runtime.ts - Progreso real (duelos ganados) y posición guardada del jugador para el overworld.
import { getCurrentUserSession } from "@/services/auth/get-current-user-session";
import { createSupabasePlayerStoryDuelProgressRepository } from "@/infrastructure/persistence/supabase/create-supabase-player-story-duel-progress-repository";
import { createSupabasePlayerStoryWorldRepository } from "@/infrastructure/persistence/supabase/create-supabase-player-story-world-repository";
import { IPlayerOverworldPosition } from "@/core/entities/story/IPlayerOverworldState";

export interface IStoryOverworldRuntime {
  completedNodeIds: string[];
  initialPosition: IPlayerOverworldPosition | null;
}

/**
 * Devuelve los nodos completados (duelos ganados, fuente de verdad de los desbloqueos)
 * y la posición guardada si corresponde al mapa pedido. `null` si no hay sesión.
 */
export async function getStoryOverworldRuntime(mapId: string): Promise<IStoryOverworldRuntime | null> {
  const session = await getCurrentUserSession();
  if (!session) return null;
  const progressRepository = await createSupabasePlayerStoryDuelProgressRepository();
  const worldRepository = await createSupabasePlayerStoryWorldRepository();
  const [progress, overworld] = await Promise.all([
    progressRepository.listByPlayerId(session.user.id),
    worldRepository
      .getOverworldStateByPlayerId(session.user.id)
      .catch(() => ({ mapId: null, position: null })),
  ]);
  return {
    completedNodeIds: progress
      .filter((entry) => entry.bestResult === "WON")
      .map((entry) => entry.duelId),
    initialPosition: overworld.mapId === mapId ? overworld.position : null,
  };
}
