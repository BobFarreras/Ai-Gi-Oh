// src/components/hub/story/internal/scene/utils/resolve-story-avatar-side-direction.ts - Resuelve la orientación lateral del avatar según el vector entre nodos.
import { IStoryMapNodeRuntime } from "@/services/story/story-map-runtime-data";
import { StoryAvatarSideDirection } from "@/components/hub/story/internal/scene/types/story-avatar-visual-target";

function resolveAxisDelta(node: IStoryMapNodeRuntime | null): { x: number; y: number } | null {
  if (!node?.position) return null;
  return { x: node.position.x, y: node.position.y };
}

/**
 * Devuelve el lado de llegada al nodo destino (opuesto al vector de avance) para no sobrepasar el objetivo.
 */
export function resolveStoryAvatarSideDirection(
  fromNode: IStoryMapNodeRuntime | null,
  toNode: IStoryMapNodeRuntime | null,
): StoryAvatarSideDirection {
  const from = resolveAxisDelta(fromNode);
  const to = resolveAxisDelta(toNode);
  if (!from || !to) return "LEFT";
  const deltaX = to.x - from.x;
  const deltaY = to.y - from.y;
  if (Math.abs(deltaX) >= Math.abs(deltaY)) return deltaX >= 0 ? "LEFT" : "RIGHT";
  return deltaY >= 0 ? "UP" : "DOWN";
}
