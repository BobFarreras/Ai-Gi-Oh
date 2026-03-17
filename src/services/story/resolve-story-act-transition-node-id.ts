// src/services/story/resolve-story-act-transition-node-id.ts - Resuelve el nodo portal de un acto para secuencias visuales de entrada.
import { IStoryMapNodeRuntime } from "@/services/story/story-map-runtime-data";

/**
 * Devuelve el id del nodo de transición del acto activo (`story-chX-transition-to-actY`) si existe en runtime.
 */
export function resolveStoryActTransitionNodeId(nodes: IStoryMapNodeRuntime[], activeActId: number): string | null {
  const prefix = `story-ch${activeActId}-transition-to-act`;
  return nodes.find((node) => node.id.startsWith(prefix))?.id ?? null;
}
