// src/components/hub/story/internal/scene/actions/animate-story-avatar-path.ts - Anima desplazamiento del avatar Story nodo a nodo para mejorar legibilidad del recorrido.
import { IStoryMapNodeRuntime } from "@/services/story/story-map-runtime-data";
import { IStoryAvatarVisualTarget } from "@/components/hub/story/internal/scene/types/story-avatar-visual-target";
import { resolveStoryAvatarSideDirection } from "@/components/hub/story/internal/scene/utils/resolve-story-avatar-side-direction";

interface IAnimateStoryAvatarPathInput {
  pathNodeIds: string[];
  startNodeId: string | null;
  nodesById: Record<string, IStoryMapNodeRuntime>;
  setCurrentNodeId: (nodeId: string) => void;
  setAvatarVisualTarget: (value: IStoryAvatarVisualTarget | null) => void;
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
  let previousNodeId = input.startNodeId;
  for (const nodeId of input.pathNodeIds) {
    const previousNode = previousNodeId ? input.nodesById[previousNodeId] ?? null : null;
    const node = input.nodesById[nodeId] ?? null;
    const pose = resolveNodeTravelPose(node);
    input.setCurrentNodeId(nodeId);
    input.setAvatarVisualTarget(
      pose.stance === "SIDE"
        ? { nodeId, stance: "SIDE", sideDirection: resolveStoryAvatarSideDirection(previousNode, node) }
        : { nodeId, stance: "CENTER" },
    );
    await input.wait(pose.waitMs);
    previousNodeId = nodeId;
  }
}
