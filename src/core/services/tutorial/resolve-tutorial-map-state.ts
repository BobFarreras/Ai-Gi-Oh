// src/core/services/tutorial/resolve-tutorial-map-state.ts - Resuelve estado de nodos tutorial dejando acceso abierto fuera del nodo ya completado.
import { ITutorialMapNodeDefinition, ITutorialMapNodeRuntime, TutorialNodeState } from "@/core/entities/tutorial/ITutorialMapNode";

interface IResolveTutorialMapStateInput {
  catalog: ITutorialMapNodeDefinition[];
  completedNodeIds?: string[];
}

function resolveNodeState(isCompleted: boolean): TutorialNodeState {
  if (isCompleted) return "COMPLETED";
  return "AVAILABLE";
}

export function resolveTutorialMapState(input: IResolveTutorialMapStateInput): ITutorialMapNodeRuntime[] {
  const completedNodeIds = new Set<string>(input.completedNodeIds ?? []);
  return [...input.catalog]
    .sort((a, b) => a.order - b.order)
    .map((node) => {
      const isCompleted = completedNodeIds.has(node.id);
      return { ...node, state: resolveNodeState(isCompleted) };
    });
}
