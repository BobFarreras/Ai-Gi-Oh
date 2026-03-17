// src/services/story/resolve-story-world-move-mode.ts - Resuelve el modo de movimiento Story (visitado, virtual, visual o grafo) con validación secuencial.
import {
  findStoryVirtualNodeDefinition,
  findStoryVisualNodeDefinition,
} from "@/services/story/map-definitions/story-map-definition-registry";
import { resolveStoryWorldTraversalPath } from "@/services/story/resolve-story-world-traversal-path";

type StoryWorldMoveMode = "VISITED" | "VIRTUAL" | "VISUAL" | "GRAPH";

interface IResolveStoryWorldMoveModeInput {
  targetNodeId: string;
  currentNodeId: string | null;
  visitedNodeIds: string[];
  completedNodeIds: string[];
  interactedNodeIds: string[];
}

interface IResolveStoryWorldMoveModeOutput {
  mode: StoryWorldMoveMode;
  isAllowed: boolean;
  validationMessage: string | null;
}

/**
 * Determina cómo debe resolverse un movimiento Story y si está permitido.
 */
export function resolveStoryWorldMoveMode(
  input: IResolveStoryWorldMoveModeInput,
): IResolveStoryWorldMoveModeOutput {
  if (input.visitedNodeIds.includes(input.targetNodeId)) {
    return { mode: "VISITED", isAllowed: true, validationMessage: null };
  }

  const virtualNode = findStoryVirtualNodeDefinition(input.targetNodeId);
  if (virtualNode) {
    if (!input.currentNodeId) {
      return { mode: "VIRTUAL", isAllowed: false, validationMessage: "No hay nodo de origen para el movimiento." };
    }
    const path = resolveStoryWorldTraversalPath({
      currentNodeId: input.currentNodeId,
      targetNodeId: input.targetNodeId,
      visitedNodeIds: input.visitedNodeIds,
      completedNodeIds: input.completedNodeIds,
      interactedNodeIds: input.interactedNodeIds,
    });
    const canMove = Boolean(path);
    return {
      mode: "VIRTUAL",
      isAllowed: canMove,
      validationMessage: canMove ? null : "No existe una ruta válida hasta el nodo virtual.",
    };
  }

  const visualNode = findStoryVisualNodeDefinition(input.targetNodeId);
  if (visualNode) {
    if (!input.currentNodeId) {
      return { mode: "VISUAL", isAllowed: false, validationMessage: "No hay nodo de origen para el movimiento." };
    }
    const path = resolveStoryWorldTraversalPath({
      currentNodeId: input.currentNodeId,
      targetNodeId: input.targetNodeId,
      visitedNodeIds: input.visitedNodeIds,
      completedNodeIds: input.completedNodeIds,
      interactedNodeIds: input.interactedNodeIds,
    });
    const isSequentialMove = Boolean(path);
    return {
      mode: "VISUAL",
      isAllowed: isSequentialMove,
      validationMessage: isSequentialMove
        ? null
        : "No existe ruta desbloqueada hasta ese nodo.",
    };
  }

  return { mode: "GRAPH", isAllowed: true, validationMessage: null };
}
