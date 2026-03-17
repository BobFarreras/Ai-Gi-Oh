// src/components/hub/story/internal/map/constants/story-map-geometry.ts - Constantes geométricas compartidas del mapa Story.

/**
 * Tamaño base (px) de ficha/token para nodos y avatar del jugador.
 */
export const STORY_NODE_TOKEN_SIZE = 80;

/**
 * Separación horizontal (px) entre ficha del nodo y ficha del jugador en modo SIDE.
 */
export const STORY_NODE_SIDE_GAP = 12;

/**
 * Distancia centro-a-centro para colocar dos fichas en paralelo sin solape.
 */
export function resolveStoryNodeSideOffsetPx(): number {
  return STORY_NODE_TOKEN_SIZE + STORY_NODE_SIDE_GAP;
}
