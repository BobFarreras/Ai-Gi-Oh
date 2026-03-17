// src/core/use-cases/story/internal/build-story-progress-state.ts - Construye estado de progreso Story a partir del grafo y nodos completados.
import { resolveStoryUnlockedNodeIds } from "@/core/services/story/world/build-story-world-graph";
import {
  IStoryWorldGraph,
  IStoryWorldHistoryEvent,
  IStoryWorldProgressState,
} from "@/core/services/story/world/story-world-types";

function resolveCurrentNodeId(graph: IStoryWorldGraph, unlockedNodeIds: string[], completedNodeIds: string[]): string | null {
  const unlockedSet = new Set(unlockedNodeIds);
  const completedSet = new Set(completedNodeIds);
  const firstPendingUnlocked = graph.nodes.find((node) => unlockedSet.has(node.id) && !completedSet.has(node.id));
  if (firstPendingUnlocked) return firstPendingUnlocked.id;
  return unlockedNodeIds[0] ?? null;
}

/**
 * Centraliza la proyección del progreso Story para evitar divergencias en múltiples casos de uso.
 */
export function buildStoryProgressState(input: {
  graph: IStoryWorldGraph;
  completedNodeIds: string[];
  history?: IStoryWorldHistoryEvent[];
  currentNodeId?: string | null;
}): IStoryWorldProgressState {
  const unlockedNodeIds = resolveStoryUnlockedNodeIds(input.graph, input.completedNodeIds);
  const fallbackNodeId = resolveCurrentNodeId(input.graph, unlockedNodeIds, input.completedNodeIds);
  return {
    currentNodeId: input.currentNodeId ?? fallbackNodeId,
    completedNodeIds: input.completedNodeIds,
    unlockedNodeIds,
    history: input.history ?? [],
  };
}
