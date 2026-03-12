// src/services/story/resolve-story-world-move-mode.ts - Resuelve el modo de movimiento Story (visitado, virtual, visual o grafo) con validación secuencial.
import {
  findStoryVirtualNodeDefinition,
  findStoryVisualNodeDefinition,
} from "@/services/story/map-definitions/story-map-definition-registry";

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

function canMoveToVirtualNode(input: {
  currentNodeId: string | null;
  requiredNodeId: string | null;
  completedNodeIds: string[];
  interactedNodeIds: string[];
}): boolean {
  if (!input.requiredNodeId) return true;
  if (input.currentNodeId !== input.requiredNodeId) return false;
  const requiredVirtualNode = findStoryVirtualNodeDefinition(input.requiredNodeId);
  if (requiredVirtualNode?.nodeType === "MOVE") return true;
  return (
    input.completedNodeIds.includes(input.requiredNodeId) ||
    input.interactedNodeIds.includes(input.requiredNodeId)
  );
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
    const canMove = canMoveToVirtualNode({
      currentNodeId: input.currentNodeId,
      requiredNodeId: virtualNode.unlockRequirementNodeId,
      completedNodeIds: input.completedNodeIds,
      interactedNodeIds: input.interactedNodeIds,
    });
    return {
      mode: "VIRTUAL",
      isAllowed: canMove,
      validationMessage: canMove ? null : "El nodo virtual todavía está bloqueado.",
    };
  }

  const visualNode = findStoryVisualNodeDefinition(input.targetNodeId);
  if (visualNode) {
    const isSequentialMove =
      !visualNode.unlockRequirementNodeId ||
      visualNode.unlockRequirementNodeId === input.currentNodeId;
    return {
      mode: "VISUAL",
      isAllowed: isSequentialMove,
      validationMessage: isSequentialMove
        ? null
        : "Debes resolver el nodo anterior antes de avanzar.",
    };
  }

  return { mode: "GRAPH", isAllowed: true, validationMessage: null };
}
