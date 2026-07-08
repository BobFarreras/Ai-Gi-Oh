// src/services/story/overworld/overworld-feature-flag.ts - Flag server-side del overworld Story (reemplaza el panel de nodos cuando está activo).

/**
 * Cuando está activo, el overworld sustituye al panel de nodos clásico: la ruta del overworld
 * deja de dar 404 y `/hub/story` redirige a él. Se controla con el env `STORY_OVERWORLD_ENABLED`
 * (por defecto apagado), así el despliegue es reversible al instante desde Vercel.
 */
export function isStoryOverworldEnabled(): boolean {
  return process.env.STORY_OVERWORLD_ENABLED === "true";
}
