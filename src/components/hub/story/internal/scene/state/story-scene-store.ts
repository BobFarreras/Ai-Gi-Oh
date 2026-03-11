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
}

function createNodesById(nodes: IStoryMapNodeRuntime[]): Record<string, IStoryMapNodeRuntime> {
  // Normaliza por id para lecturas O(1) desde paneles y acciones.
  return Object.fromEntries(nodes.map((node) => [node.id, node]));
}

/**
 * Mantiene estado de escena Story (selección local + historial) sin re-render global del módulo.
 */
export function createStorySceneStore(input: {
  nodes: IStoryMapNodeRuntime[];
  currentNodeId: string | null;
}) {
  const defaultNodeId =
    input.currentNodeId ??
    input.nodes.find((node) => node.id === "story-ch1-player-start")?.id ??
    input.nodes[0]?.id ??
    null;
  return create<IStorySceneState>((set) => ({
    selectedNodeId: defaultNodeId,
    currentNodeId: defaultNodeId,
    nodesById: createNodesById(input.nodes),
    setSelectedNodeId: (selectedNodeId) => set({ selectedNodeId }),
    setCurrentNodeId: (currentNodeId) => set({ currentNodeId }),
    markNodeCompleted: (nodeId) =>
      set((state) => {
        const targetNode = state.nodesById[nodeId];
        if (!targetNode) return state;
        return {
          nodesById: {
            ...state.nodesById,
            [nodeId]: { ...targetNode, isCompleted: true },
          },
        };
      }),
  }));
}

export type StorySceneStore = ReturnType<typeof createStorySceneStore>;
