// src/components/hub/story/internal/map/story-opponent-avatar.ts - Centraliza la resolucion de avatar fallback para oponentes del mapa Story.
import { IStoryMapNodeRuntime } from "@/services/story/story-map-runtime-data";

export const STORY_DEFAULT_OPPONENT_AVATAR_URL = "/assets/story/opponents/opp-ch1-apprentice/avatar-GenNvim.png";

/**
 * Devuelve la URL de avatar valida para nodos de combate con fallback estable.
 */
export function resolveStoryOpponentAvatarUrl(node: IStoryMapNodeRuntime | null): string {
  return node?.opponentAvatarUrl ?? STORY_DEFAULT_OPPONENT_AVATAR_URL;
}

