// src/services/story/overworld/get-story-overworld-runtime.ts - Progreso real (duelos ganados) y posición guardada del jugador para el overworld.
import { getCurrentUserSession } from "@/services/auth/get-current-user-session";
import { createSupabasePlayerStoryDuelProgressRepository } from "@/infrastructure/persistence/supabase/create-supabase-player-story-duel-progress-repository";
import { createSupabasePlayerStoryWorldRepository } from "@/infrastructure/persistence/supabase/create-supabase-player-story-world-repository";
import { IPlayerOverworldPosition } from "@/core/entities/story/IPlayerOverworldState";
import { DEFAULT_OVERWORLD_MAP_ID, isKnownOverworldMap } from "@/services/story/overworld/resolve-overworld-tilemap";

export interface IStoryOverworldRuntime {
  /** Mapa/acto activo del jugador (guardado tras cruzar un portal). Por defecto `act-1`. */
  currentMapId: string;
  completedNodeIds: string[];
  initialPosition: IPlayerOverworldPosition | null;
  /** Nodos ya interactuados (recompensas recogidas): no se vuelven a otorgar ni dibujar. */
  interactedNodeIds: string[];
}

/**
 * Devuelve el mapa activo del jugador, los nodos completados (duelos ganados, fuente de verdad
 * de los desbloqueos), la posición guardada y los nodos interactuados. `null` si no hay sesión.
 */
export async function getStoryOverworldRuntime(): Promise<IStoryOverworldRuntime | null> {
  const session = await getCurrentUserSession();
  if (!session) return null;
  const progressRepository = await createSupabasePlayerStoryDuelProgressRepository();
  const worldRepository = await createSupabasePlayerStoryWorldRepository();
  const [progress, overworld, compact] = await Promise.all([
    progressRepository.listByPlayerId(session.user.id),
    worldRepository
      .getOverworldStateByPlayerId(session.user.id)
      .catch(() => ({ mapId: null, position: null })),
    worldRepository
      .getCompactStateByPlayerId(session.user.id)
      .catch(() => ({ currentNodeId: null, visitedNodeIds: [], interactedNodeIds: [] })),
  ]);
  const hasKnownMap = Boolean(overworld.mapId && isKnownOverworldMap(overworld.mapId));
  return {
    currentMapId: hasKnownMap ? overworld.mapId! : DEFAULT_OVERWORLD_MAP_ID,
    completedNodeIds: progress
      .filter((entry) => entry.bestResult === "WON")
      .map((entry) => entry.duelId),
    initialPosition: hasKnownMap ? overworld.position : null,
    interactedNodeIds: compact.interactedNodeIds,
  };
}
