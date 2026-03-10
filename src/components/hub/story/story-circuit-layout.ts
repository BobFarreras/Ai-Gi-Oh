// src/components/hub/story/story-circuit-layout.ts - Calcula posiciones y segmentos de nodos Story de forma dinámica según dependencias.
import { IStoryMapNodeRuntime } from "@/services/story/story-map-runtime-data";

export interface IStoryCircuitPosition {
  x: number;
  y: number;
}

export interface IStoryCircuitSegment {
  from: IStoryCircuitPosition;
  to: IStoryCircuitPosition;
}

function sortNodes(nodes: IStoryMapNodeRuntime[]): IStoryMapNodeRuntime[] {
  return [...nodes].sort((left, right) => {
    if (left.chapter !== right.chapter) return left.chapter - right.chapter;
    return left.duelIndex - right.duelIndex;
  });
}

/**
 * Construye un mapa de posiciones basado en jerarquía de dependencias (`unlockRequirementNodeId`).
 */
export function buildStoryNodePositionMap(nodes: IStoryMapNodeRuntime[]): Record<string, IStoryCircuitPosition> {
  const sortedNodes = sortNodes(nodes);
  const childrenByParent = new Map<string, IStoryMapNodeRuntime[]>();
  const nodeById = new Map(sortedNodes.map((node) => [node.id, node]));
  const positions: Record<string, IStoryCircuitPosition> = {};

  for (const node of sortedNodes) {
    const parentId = node.unlockRequirementNodeId ?? null;
    if (!parentId) continue;
    const group = childrenByParent.get(parentId) ?? [];
    group.push(node);
    childrenByParent.set(parentId, group);
  }

  const roots = sortedNodes.filter(
    (node) => !node.unlockRequirementNodeId || !nodeById.has(node.unlockRequirementNodeId),
  );
  const rootSpacing = 380;
  const rootStartX = 1000 - ((roots.length - 1) * rootSpacing) / 2;
  roots.forEach((root, index) => {
    positions[root.id] = { x: rootStartX + index * rootSpacing, y: 1700 };
  });

  const visited = new Set<string>();
  const placeChildren = (parentId: string): void => {
    if (visited.has(parentId)) return;
    visited.add(parentId);
    const parentPosition = positions[parentId];
    const children = (childrenByParent.get(parentId) ?? []).sort(
      (left, right) => left.duelIndex - right.duelIndex,
    );
    if (!parentPosition || children.length === 0) return;
    const siblingSpacing = 340;
    children.forEach((child, index) => {
      const offset = (index - (children.length - 1) / 2) * siblingSpacing;
      positions[child.id] = { x: parentPosition.x + offset, y: parentPosition.y - 260 };
      placeChildren(child.id);
    });
  };

  roots.forEach((root) => placeChildren(root.id));
  sortedNodes.forEach((node, index) => {
    if (positions[node.id]) return;
    positions[node.id] = { x: 700 + (index % 4) * 260, y: 1100 - Math.floor(index / 4) * 220 };
  });

  return positions;
}

export function resolveStoryNodePosition(
  nodeId: string,
  positionMap: Record<string, IStoryCircuitPosition>,
): IStoryCircuitPosition {
  return positionMap[nodeId] ?? { x: 1000, y: 1000 };
}

export function resolveStoryPathSegments(
  nodes: IStoryMapNodeRuntime[],
  positionMap: Record<string, IStoryCircuitPosition>,
): IStoryCircuitSegment[] {
  return nodes.flatMap((node) => {
    if (!node.unlockRequirementNodeId) return [];
    const parent = positionMap[node.unlockRequirementNodeId];
    const child = positionMap[node.id];
    if (!parent || !child) return [];
    return [{ from: parent, to: child }];
  });
}
