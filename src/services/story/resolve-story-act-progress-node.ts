// src/services/story/resolve-story-act-progress-node.ts - Resuelve el nodo objetivo de un acto según progreso visitado/completado.
import { IStoryMapNodeRuntime } from "@/services/story/story-map-runtime-data";

/**
 * Prioriza el último nodo visitado desbloqueado del acto; si no existe, toma el completado de mayor índice.
 */
export function resolveStoryActProgressNode(input: {
  actNodes: IStoryMapNodeRuntime[];
  visitedNodeIds: string[];
}): string | null {
  const actNodeIdSet = new Set(input.actNodes.map((node) => node.id));
  const latestVisitedNodeId = [...input.visitedNodeIds]
    .reverse()
    .find((nodeId) => actNodeIdSet.has(nodeId) && input.actNodes.some((node) => node.id === nodeId && node.isUnlocked));
  if (latestVisitedNodeId) return latestVisitedNodeId;
  const latestCompletedNode = [...input.actNodes]
    .filter((node) => node.isUnlocked && node.isCompleted)
    .sort((left, right) => right.duelIndex - left.duelIndex)[0];
  return latestCompletedNode?.id ?? null;
}
