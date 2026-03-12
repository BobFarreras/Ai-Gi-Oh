// src/components/hub/story/internal/map/layout/resolve-story-retreat-trail.ts - Resuelve la ruta visual de retirada del rival siguiendo nodos conectados del mapa.
import { IStoryMapNodeRuntime } from "@/services/story/story-map-runtime-data";
import { IStoryCircuitPosition, resolveStoryNodeTokenAnchor } from "@/components/hub/story/internal/map/layout/story-circuit-layout";

interface IResolveStoryRetreatTrailInput {
  retreatingNodeId: string | null;
  nodes: IStoryMapNodeRuntime[];
  positionMap: Record<string, IStoryCircuitPosition>;
}

/**
 * Construye una trayectoria para que la ficha rival retroceda por el grafo.
 * En ramas múltiples prioriza el camino con mayor avance horizontal.
 */
export function resolveStoryRetreatTrail(input: IResolveStoryRetreatTrailInput): IStoryCircuitPosition[] {
  if (!input.retreatingNodeId) return [];
  const nodeById = new Map(input.nodes.map((node) => [node.id, node]));
  const childrenByNodeId = new Map<string, string[]>();
  for (const node of input.nodes) {
    if (node.unlockRequirementNodeId) {
      const group = childrenByNodeId.get(node.unlockRequirementNodeId) ?? [];
      group.push(node.id);
      childrenByNodeId.set(node.unlockRequirementNodeId, group);
    }
    for (const linkedNodeId of node.pathLinkFromNodeIds ?? []) {
      const group = childrenByNodeId.get(linkedNodeId) ?? [];
      group.push(node.id);
      childrenByNodeId.set(linkedNodeId, group);
    }
  }
  const visitedNodeIds = new Set<string>([input.retreatingNodeId]);
  const trailNodeIds: string[] = [input.retreatingNodeId];
  let cursorNodeId = input.retreatingNodeId;
  while (true) {
    const cursorAnchor = resolveStoryNodeTokenAnchor(cursorNodeId, input.positionMap);
    const nextNodeId = (childrenByNodeId.get(cursorNodeId) ?? [])
      .filter((candidateNodeId) => !visitedNodeIds.has(candidateNodeId) && nodeById.has(candidateNodeId))
      .sort((leftNodeId, rightNodeId) => {
        const leftAnchor = resolveStoryNodeTokenAnchor(leftNodeId, input.positionMap);
        const rightAnchor = resolveStoryNodeTokenAnchor(rightNodeId, input.positionMap);
        const xDelta = rightAnchor.x - leftAnchor.x;
        if (xDelta !== 0) return xDelta;
        const leftDistance = Math.abs(leftAnchor.y - cursorAnchor.y);
        const rightDistance = Math.abs(rightAnchor.y - cursorAnchor.y);
        return leftDistance - rightDistance;
      })[0];
    if (!nextNodeId) break;
    visitedNodeIds.add(nextNodeId);
    trailNodeIds.push(nextNodeId);
    cursorNodeId = nextNodeId;
  }
  if (trailNodeIds.length === 1) {
    const base = resolveStoryNodeTokenAnchor(input.retreatingNodeId, input.positionMap);
    return [base, { x: base.x + 140, y: base.y }];
  }
  return trailNodeIds.map((nodeId) => resolveStoryNodeTokenAnchor(nodeId, input.positionMap));
}
