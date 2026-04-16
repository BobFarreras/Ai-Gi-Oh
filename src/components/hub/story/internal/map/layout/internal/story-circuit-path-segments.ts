// src/components/hub/story/internal/map/layout/internal/story-circuit-path-segments.ts - Construye segmentos del mapa Story respetando reglas de visibilidad.
import { IStoryMapNodeRuntime } from "@/services/story/story-map-runtime-data";
import type { IStoryCircuitPosition, IStoryCircuitSegment } from "../story-circuit-layout";

const STORY_PLATFORM_RADIUS_X = 48;
const STORY_PLATFORM_RADIUS_Y = 10;

interface IStoryPathSegmentDependencies {
  nodes: IStoryMapNodeRuntime[];
  positionMap: Record<string, IStoryCircuitPosition>;
  resolvePlatformAnchor: (nodeId: string, positionMap: Record<string, IStoryCircuitPosition>) => IStoryCircuitPosition;
}

function resolveEdgeAnchor(
  sourceNodeId: string,
  targetNodeId: string,
  positionMap: Record<string, IStoryCircuitPosition>,
  resolvePlatformAnchor: (nodeId: string, positionMap: Record<string, IStoryCircuitPosition>) => IStoryCircuitPosition,
): IStoryCircuitPosition {
  const source = resolvePlatformAnchor(sourceNodeId, positionMap);
  const target = resolvePlatformAnchor(targetNodeId, positionMap);
  const deltaX = target.x - source.x;
  const deltaY = target.y - source.y;
  const distance = Math.hypot(deltaX, deltaY);
  if (distance === 0) return source;
  const nx = deltaX / distance;
  const ny = deltaY / distance;
  return { x: source.x + nx * STORY_PLATFORM_RADIUS_X, y: source.y + ny * STORY_PLATFORM_RADIUS_Y };
}

/**
 * Calcula conexiones de desbloqueo y enlaces secundarios según estado de progreso.
 */
export function buildStoryPathSegments({
  nodes,
  positionMap,
  resolvePlatformAnchor,
}: IStoryPathSegmentDependencies): IStoryCircuitSegment[] {
  const segments: IStoryCircuitSegment[] = [];
  const nodeIdSet = new Set(nodes.map((node) => node.id));
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const shouldRenderUnlockSegment = (requirementNodeId: string, targetNodeId: string): boolean => {
    const requirementNode = nodeById.get(requirementNodeId);
    if (!requirementNode) return false;
    if (targetNodeId === "story-ch2-boss-bridge") return requirementNode.isCompleted;
    return true;
  };
  const shouldRenderLinkedSegment = (fromNodeId: string, targetNodeId: string): boolean => {
    if (fromNodeId === "story-ch2-branch-lower-down-b" && targetNodeId === "story-ch2-boss-bridge") {
      return nodeById.get("story-ch2-bridge-submission")?.isCompleted ?? false;
    }
    return true;
  };
  const pushSegment = (fromNodeId: string, toNodeId: string): void => {
    const from = resolveEdgeAnchor(fromNodeId, toNodeId, positionMap, resolvePlatformAnchor);
    const to = resolveEdgeAnchor(toNodeId, fromNodeId, positionMap, resolvePlatformAnchor);
    segments.push({ from, to });
  };

  for (const node of nodes) {
    if (node.unlockRequirementNodeId && nodeIdSet.has(node.unlockRequirementNodeId)) {
      if (shouldRenderUnlockSegment(node.unlockRequirementNodeId, node.id)) pushSegment(node.unlockRequirementNodeId, node.id);
    }
    for (const linkedNodeId of node.pathLinkFromNodeIds ?? []) {
      if (nodeIdSet.has(linkedNodeId) && shouldRenderLinkedSegment(linkedNodeId, node.id)) pushSegment(linkedNodeId, node.id);
    }
  }
  return segments;
}
