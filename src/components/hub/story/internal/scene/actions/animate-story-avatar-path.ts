// src/components/hub/story/internal/scene/actions/animate-story-avatar-path.ts - Anima desplazamiento del avatar Story nodo a nodo para mejorar legibilidad del recorrido.
import { IStoryMapNodeRuntime } from "@/services/story/story-map-runtime-data";

interface IAnimateStoryAvatarPathInput {
  pathNodeIds: string[];
  nodesById: Record<string, IStoryMapNodeRuntime>;
  setCurrentNodeId: (nodeId: string) => void;
  setAvatarVisualTarget: (value: { nodeId: string; stance: "CENTER" | "SIDE" | "PORTAL" } | null) => void;
  wait: (ms: number) => Promise<void>;
}

function resolveNodeTravelPose(node: IStoryMapNodeRuntime | null): { stance: "CENTER" | "SIDE"; waitMs: number } {
  if (!node) return { stance: "CENTER", waitMs: 260 };
  const shouldStaySide = node.nodeType !== "MOVE" && !node.isCompleted;
  return shouldStaySide ? { stance: "SIDE", waitMs: 340 } : { stance: "CENTER", waitMs: 280 };
}

/**
 * Recorre visualmente una ruta completa en pasos para respetar el grafo del mapa.
 */
export async function animateStoryAvatarPath(input: IAnimateStoryAvatarPathInput): Promise<void> {
  for (const nodeId of input.pathNodeIds) {
    const node = input.nodesById[nodeId] ?? null;
    const pose = resolveNodeTravelPose(node);
    input.setCurrentNodeId(nodeId);
    input.setAvatarVisualTarget({ nodeId, stance: pose.stance });
    await input.wait(pose.waitMs);
  }
}
