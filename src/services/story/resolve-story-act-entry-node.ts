// src/services/story/resolve-story-act-entry-node.ts - Decide el nodo inicial al abrir un acto según dirección de cambio y progreso previo.
import { IStoryMapNodeRuntime } from "@/services/story/story-map-runtime-data";
import { resolveStoryActProgressNode } from "@/services/story/resolve-story-act-progress-node";

/**
 * Al avanzar a un acto superior entra por su inicio; al volver a uno anterior recupera el último nodo progresado.
 */
export function resolveStoryActEntryNode(input: {
  preferredActId: number | null;
  activeActId: number;
  currentActId: number | null;
  actStartNodeId: string | null;
  actNodes: IStoryMapNodeRuntime[];
  visitedNodeIds: string[];
  effectiveCurrentNodeId: string | null;
}): string | null {
  if (input.preferredActId !== input.activeActId) {
    return input.actNodes.some((node) => node.id === input.effectiveCurrentNodeId)
      ? input.effectiveCurrentNodeId
      : input.actStartNodeId;
  }
  const isForwardTransition =
    input.currentActId !== null && input.preferredActId !== null && input.preferredActId > input.currentActId;
  if (isForwardTransition) return input.actStartNodeId;
  return (
    resolveStoryActProgressNode({
      actNodes: input.actNodes,
      visitedNodeIds: input.visitedNodeIds,
    }) ?? input.actStartNodeId
  );
}
