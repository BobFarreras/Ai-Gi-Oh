// src/services/story/resolve-story-act-soundtrack-url.ts - Resuelve la música de fondo global según el acto activo del modo Story.
const STORY_ACT_SOUNDTRACKS: Record<number, string> = {
  1: "/audio/story/soundtracks/act-1/act-1-main-theme.mp3",
  5: "/audio/story/soundtracks/act-5/act-5-main-theme.mp3",
};

/**
 * Devuelve la URL del soundtrack de mapa para el acto; usa fallback de Acto 1 mientras no exista pista dedicada.
 */
export function resolveStoryActSoundtrackUrl(actId: number): string {
  return STORY_ACT_SOUNDTRACKS[actId] ?? STORY_ACT_SOUNDTRACKS[1];
}
