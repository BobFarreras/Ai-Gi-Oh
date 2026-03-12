// src/core/services/story/world/story-world-navigation.ts - Reglas puras de navegación entre nodos Story conectados.
import { IStoryWorldGraph } from "@/core/services/story/world/story-world-types";

function hasOutgoingEdge(
  graph: IStoryWorldGraph,
  fromNodeId: string,
  toNodeId: string,
): boolean {
  return graph.edges.some(
    (edge) => edge.fromNodeId === fromNodeId && edge.toNodeId === toNodeId,
  );
}

/**
 * Permite navegación si el destino está desbloqueado y existe conexión directa.
 */
export function canMoveBetweenStoryNodes(input: {
  graph: IStoryWorldGraph;
  fromNodeId: string | null;
  toNodeId: string;
  unlockedNodeIds: string[];
}): boolean {
  const unlockedSet = new Set(input.unlockedNodeIds);
  if (!unlockedSet.has(input.toNodeId)) return false;
  if (input.fromNodeId === null) return true;
  if (input.fromNodeId === input.toNodeId) return true;
  return hasOutgoingEdge(input.graph, input.fromNodeId, input.toNodeId);
}
