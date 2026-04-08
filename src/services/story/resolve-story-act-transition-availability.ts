// src/services/story/resolve-story-act-transition-availability.ts - Controla transiciones Story temporalmente deshabilitadas por roadmap narrativo.
const UNAVAILABLE_TRANSITION_NODE_IDS = new Set<string>([
  "story-ch2-transition-to-act3",
]);

/**
 * Indica si un nodo de teletransporte entre actos está disponible para navegar.
 */
export function isStoryActTransitionAvailable(nodeId: string): boolean {
  return !UNAVAILABLE_TRANSITION_NODE_IDS.has(nodeId);
}

/**
 * Mensaje diegético para transiciones bloqueadas por contenido en construcción.
 */
export function resolveStoryActTransitionUnavailableMessage(nodeId: string): string | null {
  if (nodeId === "story-ch2-transition-to-act3") {
    return "Acto 3 en reconstrucción. Los nodos del siguiente sector aún no están listos.";
  }
  return null;
}
