// src/services/story/resolve-story-act-transition-target.ts - Resuelve si un nodo Story representa una transición de acto y su destino.
const STORY_ACT_TRANSITION_TARGET_BY_NODE_ID: Record<string, number> = {
  "story-ch1-transition-to-act2": 2,
  "story-ch2-transition-to-act1": 1,
};

/**
 * Devuelve el acto destino para nodos de transición entre actos.
 */
export function resolveStoryActTransitionTarget(nodeId: string): number | null {
  return STORY_ACT_TRANSITION_TARGET_BY_NODE_ID[nodeId] ?? null;
}

