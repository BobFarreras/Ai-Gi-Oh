// src/components/hub/story/internal/scene/state/story-scene-store.ts - Store local Zustand para estado UI del mapa Story sin acoplar dominio.
import { create } from "zustand";
import { IStoryMapNodeRuntime } from "@/services/story/story-map-runtime-data";

interface IStorySceneState {
  selectedNodeId: string | null;
  currentNodeId: string | null;
  nodesById: Record<string, IStoryMapNodeRuntime>;
  setSelectedNodeId: (nodeId: string | null) => void;
  setCurrentNodeId: (nodeId: string | null) => void;
  markNodeCompleted: (nodeId: string) => void;
  hydrateFromRuntime: (input: { nodes: IStoryMapNodeRuntime[]; currentNodeId: string | null }) => void;
}

function createNodesById(nodes: IStoryMapNodeRuntime[]): Record<string, IStoryMapNodeRuntime> {
  // Normaliza por id para lecturas O(1) desde paneles y acciones.
  return Object.fromEntries(nodes.map((node) => [node.id, node]));
}

function resolveDefaultNodeId(input: { nodes: IStoryMapNodeRuntime[]; currentNodeId: string | null }): string | null {
  return (
    input.currentNodeId ??
    input.nodes.find((node) => node.id === "story-ch1-player-start")?.id ??
    input.nodes[0]?.id ??
    null
  );
}

function resolveNodeUnlocked(
  node: IStoryMapNodeRuntime,
  nodesById: Record<string, IStoryMapNodeRuntime>,
  currentNodeId: string | null,
): boolean {
  if (node.id === currentNodeId) return true;
  if (node.isCompleted) return true;
  if (!node.unlockRequirementNodeId) return node.isUnlocked;
  const dependencyNode = nodesById[node.unlockRequirementNodeId];
  if (!dependencyNode) return false;
  if (dependencyNode.nodeType === "MOVE") {
    return dependencyNode.id === currentNodeId || dependencyNode.isCompleted;
  }
  return dependencyNode.isCompleted;
}

/**
 * Recalcula desbloqueo local para reflejar movimiento/interacción sin esperar recarga de runtime.
 */
function recalculateNodeUnlocks(
  nodesById: Record<string, IStoryMapNodeRuntime>,
  currentNodeId: string | null,
): Record<string, IStoryMapNodeRuntime> {
  const nextNodesById = Object.fromEntries(
    Object.entries(nodesById).map(([id, node]) => [id, { ...node }]),
  ) as Record<string, IStoryMapNodeRuntime>;
  for (const node of Object.values(nextNodesById)) {
    node.isUnlocked = resolveNodeUnlocked(node, nextNodesById, currentNodeId);
  }
  return nextNodesById;
}

/**
 * Mantiene estado de escena Story (selección local + historial) sin re-render global del módulo.
 */
export function createStorySceneStore(input: {
  nodes: IStoryMapNodeRuntime[];
  currentNodeId: string | null;
}) {
  const defaultNodeId = resolveDefaultNodeId(input);
  return create<IStorySceneState>((set) => ({
    selectedNodeId: defaultNodeId,
    currentNodeId: defaultNodeId,
    nodesById: createNodesById(input.nodes),
    setSelectedNodeId: (selectedNodeId) => set({ selectedNodeId }),
    setCurrentNodeId: (currentNodeId) =>
      set((state) => {
        if (!currentNodeId) return { currentNodeId };
        const previousNode = state.currentNodeId ? state.nodesById[state.currentNodeId] ?? null : null;
        const currentNode = state.nodesById[currentNodeId];
        const nextNodesById = {
          ...state.nodesById,
          ...(previousNode?.nodeType === "MOVE"
            ? { [previousNode.id]: { ...previousNode, isCompleted: true } }
            : {}),
          ...(currentNode?.nodeType === "MOVE"
            ? { [currentNodeId]: { ...currentNode, isCompleted: true } }
            : {}),
        };
        return {
          currentNodeId,
          nodesById: recalculateNodeUnlocks(nextNodesById, currentNodeId),
        };
      }),
    markNodeCompleted: (nodeId) =>
      set((state) => {
        const targetNode = state.nodesById[nodeId];
        if (!targetNode) return state;
        const nextNodesById = {
          ...state.nodesById,
          [nodeId]: { ...targetNode, isCompleted: true },
        };
        return {
          nodesById: recalculateNodeUnlocks(nextNodesById, state.currentNodeId),
        };
      }),
    hydrateFromRuntime: (runtime) =>
      set((state) => {
        const nextCurrentNodeId = resolveDefaultNodeId(runtime);
        const nextNodesById = recalculateNodeUnlocks(createNodesById(runtime.nodes), nextCurrentNodeId);
        const selectedNodeId =
          state.selectedNodeId && nextNodesById[state.selectedNodeId]
            ? state.selectedNodeId
            : nextCurrentNodeId;
        return {
          currentNodeId: nextCurrentNodeId,
          selectedNodeId,
          nodesById: nextNodesById,
        };
      }),
  }));
}

export type StorySceneStore = ReturnType<typeof createStorySceneStore>;
