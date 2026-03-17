// src/components/hub/story/internal/scene/state/resolve-story-scene-can-move.ts - Resuelve si el botón de movimiento debe habilitarse para el nodo Story seleccionado.
import { IStoryMapNodeRuntime } from "@/services/story/story-map-runtime-data";

/**
 * Habilita el movimiento para plataformas vacías, nodos visuales o nodos ya resueltos.
 */
export function resolveStorySceneCanMove(input: {
  selectedNode: IStoryMapNodeRuntime | null;
  currentNodeId: string | null;
  isInteracting: boolean;
  isDialogOpen: boolean;
}): boolean {
  const { selectedNode, currentNodeId, isInteracting, isDialogOpen } = input;
  if (!selectedNode || !selectedNode.isUnlocked) return false;
  const isUnresolvedDuelNode =
    (selectedNode.nodeType === "DUEL" || selectedNode.nodeType === "BOSS") && !selectedNode.isCompleted;
  if (isUnresolvedDuelNode) return false;
  if (selectedNode.id === currentNodeId) return false;
  if (isInteracting || isDialogOpen) return false;
  return true;
}
