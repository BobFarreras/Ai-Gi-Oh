// src/components/hub/story/internal/map/layout/story-circuit-layout.ts - Calcula posiciones y segmentos de nodos Story de forma dinámica según dependencias.
import { IStoryMapNodeRuntime } from "@/services/story/story-map-runtime-data";

export interface IStoryCircuitPosition {
  x: number;
  y: number;
}

export interface IStoryCircuitSegment {
  from: IStoryCircuitPosition;
  to: IStoryCircuitPosition;
}

const STORY_NODE_PLATFORM_OFFSET_Y = 56;
const STORY_NODE_TOKEN_OFFSET_Y = 8;
const STORY_PLATFORM_RADIUS_X = 48;
const STORY_PLATFORM_RADIUS_Y = 10;

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
    if (!node.position) continue;
    positions[node.id] = { x: node.position.x, y: node.position.y };
  }

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
  const unresolvedRoots = roots.filter((root) => !positions[root.id]);
  const rootSpacing = 380;
  const rootStartX = 1000 - ((unresolvedRoots.length - 1) * rootSpacing) / 2;
  unresolvedRoots.forEach((root, index) => {
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
      if (!positions[child.id]) positions[child.id] = { x: parentPosition.x + offset, y: parentPosition.y - 260 };
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

/**
 * Devuelve el punto de anclaje de plataforma (debajo del token) para trazar caminos.
 */
export function resolveStoryNodePlatformAnchor(
  nodeId: string,
  positionMap: Record<string, IStoryCircuitPosition>,
): IStoryCircuitPosition {
  const nodePosition = resolveStoryNodePosition(nodeId, positionMap);
  return { x: nodePosition.x, y: nodePosition.y + STORY_NODE_PLATFORM_OFFSET_Y };
}

/**
 * Devuelve el punto central del token/ficha del nodo para alinear avatar y elementos flotantes.
 */
export function resolveStoryNodeTokenAnchor(
  nodeId: string,
  positionMap: Record<string, IStoryCircuitPosition>,
): IStoryCircuitPosition {
  const nodePosition = resolveStoryNodePosition(nodeId, positionMap);
  return { x: nodePosition.x, y: nodePosition.y + STORY_NODE_TOKEN_OFFSET_Y };
}

export function resolveStoryPathSegments(
  nodes: IStoryMapNodeRuntime[],
  positionMap: Record<string, IStoryCircuitPosition>,
): IStoryCircuitSegment[] {
  const segments: IStoryCircuitSegment[] = [];
  const nodeIdSet = new Set(nodes.map((node) => node.id));
  const resolveEdgeAnchor = (
    sourceNodeId: string,
    targetNodeId: string,
  ): IStoryCircuitPosition => {
    const source = resolveStoryNodePlatformAnchor(sourceNodeId, positionMap);
    const target = resolveStoryNodePlatformAnchor(targetNodeId, positionMap);
    const deltaX = target.x - source.x;
    const deltaY = target.y - source.y;
    const distance = Math.hypot(deltaX, deltaY);
    if (distance === 0) return source;
    const nx = deltaX / distance;
    const ny = deltaY / distance;
    return {
      x: source.x + nx * STORY_PLATFORM_RADIUS_X,
      y: source.y + ny * STORY_PLATFORM_RADIUS_Y,
    };
  };
  const pushSegment = (fromNodeId: string, toNodeId: string) => {
    const from = resolveEdgeAnchor(fromNodeId, toNodeId);
    const to = resolveEdgeAnchor(toNodeId, fromNodeId);
    segments.push({ from, to });
  };
  for (const node of nodes) {
    if (node.unlockRequirementNodeId && nodeIdSet.has(node.unlockRequirementNodeId)) {
      pushSegment(node.unlockRequirementNodeId, node.id);
    }
    for (const linkedNodeId of node.pathLinkFromNodeIds ?? []) {
      if (nodeIdSet.has(linkedNodeId)) pushSegment(linkedNodeId, node.id);
    }
  }
  return segments;
}
