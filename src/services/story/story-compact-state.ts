// src/services/story/story-compact-state.ts - Utilidades puras para actualizar estado compacto de navegación Story.
import { IPlayerStoryWorldCompactState } from "@/core/entities/story/IPlayerStoryWorldCompactState";

function uniq(values: string[]): string[] {
  return Array.from(new Set(values.filter((value) => value.length > 0)));
}

/**
 * Marca nodos visitados al moverse y actualiza el cursor actual del mapa.
 */
export function applyStoryMoveToCompactState(input: {
  state: IPlayerStoryWorldCompactState;
  fromNodeId: string | null;
  targetNodeId: string;
}): IPlayerStoryWorldCompactState {
  return {
    currentNodeId: input.targetNodeId,
    visitedNodeIds: uniq([
      ...input.state.visitedNodeIds,
      ...(input.fromNodeId ? [input.fromNodeId] : []),
      input.targetNodeId,
    ]),
    interactedNodeIds: uniq(input.state.interactedNodeIds),
  };
}

/**
 * Marca un nodo como interactuado sin alterar visitados previos.
 */
export function applyStoryInteractionToCompactState(input: {
  state: IPlayerStoryWorldCompactState;
  nodeId: string;
}): IPlayerStoryWorldCompactState {
  return {
    currentNodeId: input.nodeId,
    visitedNodeIds: uniq([...input.state.visitedNodeIds, input.nodeId]),
    interactedNodeIds: uniq([...input.state.interactedNodeIds, input.nodeId]),
  };
}
