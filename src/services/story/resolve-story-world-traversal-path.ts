// src/services/story/resolve-story-world-traversal-path.ts - Resuelve la ruta de movimiento Story por grafo para evitar saltos directos entre plataformas.
import { listStoryActMapDefinitions } from "@/services/story/map-definitions/story-map-definition-registry";
import { StoryWorldNodeType } from "@/core/services/story/world/story-world-types";

interface IStoryTraversalNode {
  id: string;
  nodeType: StoryWorldNodeType;
  unlockRequirementNodeId: string | null;
  pathLinkFromNodeIds: string[];
}

interface IResolveStoryWorldTraversalPathInput {
  currentNodeId: string;
  targetNodeId: string;
  visitedNodeIds: string[];
  completedNodeIds: string[];
  interactedNodeIds: string[];
}

function inferVisualNodeType(nodeId: string): StoryWorldNodeType {
  return nodeId.includes("-duel-") ? "DUEL" : "MOVE";
}

function buildTraversalNodeMap(): Map<string, IStoryTraversalNode> {
  const nodeById = new Map<string, IStoryTraversalNode>();
  for (const act of listStoryActMapDefinitions()) {
    for (const node of act.nodes) {
      nodeById.set(node.id, {
        id: node.id,
        nodeType: inferVisualNodeType(node.id),
        unlockRequirementNodeId: node.unlockRequirementNodeId ?? null,
        pathLinkFromNodeIds: node.pathLinkFromNodeIds ?? [],
      });
    }
    for (const node of act.virtualNodes ?? []) {
      nodeById.set(node.id, {
        id: node.id,
        nodeType: node.nodeType,
        unlockRequirementNodeId: node.unlockRequirementNodeId ?? null,
        pathLinkFromNodeIds: node.pathLinkFromNodeIds ?? [],
      });
    }
  }
  return nodeById;
}

function isRequirementSatisfied(requirementNodeId: string, state: IResolveStoryWorldTraversalPathInput, nodeById: Map<string, IStoryTraversalNode>): boolean {
  const requirementNode = nodeById.get(requirementNodeId);
  if (!requirementNode) return false;
  if (requirementNode.nodeType === "MOVE") return state.visitedNodeIds.includes(requirementNodeId);
  if (requirementNode.nodeType === "DUEL" || requirementNode.nodeType === "BOSS") {
    return state.completedNodeIds.includes(requirementNodeId);
  }
  return (
    state.interactedNodeIds.includes(requirementNodeId) ||
    state.completedNodeIds.includes(requirementNodeId)
  );
}

function canEnterNode(nodeId: string, fromNodeId: string, state: IResolveStoryWorldTraversalPathInput, nodeById: Map<string, IStoryTraversalNode>): boolean {
  const node = nodeById.get(nodeId);
  if (!node) return false;
  if (
    state.visitedNodeIds.includes(nodeId) ||
    state.interactedNodeIds.includes(nodeId) ||
    state.completedNodeIds.includes(nodeId)
  ) return true;
  if (!node.unlockRequirementNodeId) return true;
  if (node.unlockRequirementNodeId === fromNodeId) {
    const requirementNode = nodeById.get(node.unlockRequirementNodeId);
    if (requirementNode?.nodeType === "MOVE") return true;
    return isRequirementSatisfied(node.unlockRequirementNodeId, state, nodeById);
  }
  return isRequirementSatisfied(node.unlockRequirementNodeId, state, nodeById);
}

function isPassableIntermediateNode(nodeId: string, state: IResolveStoryWorldTraversalPathInput, nodeById: Map<string, IStoryTraversalNode>): boolean {
  if (nodeId === state.currentNodeId) return true;
  const node = nodeById.get(nodeId);
  if (!node) return false;
  if (node.nodeType === "MOVE") return true;
  return (
    state.visitedNodeIds.includes(nodeId) ||
    state.interactedNodeIds.includes(nodeId) ||
    state.completedNodeIds.includes(nodeId)
  );
}

/**
 * Devuelve la ruta mínima (incluye origen y destino) si ambos nodos están conectados y desbloqueados.
 */
export function resolveStoryWorldTraversalPath(input: IResolveStoryWorldTraversalPathInput): string[] | null {
  const nodeById = buildTraversalNodeMap();
  const startNode = nodeById.get(input.currentNodeId);
  const targetNode = nodeById.get(input.targetNodeId);
  if (!startNode || !targetNode) return null;

  const graph = new Map<string, Set<string>>();
  for (const node of nodeById.values()) {
    if (!graph.has(node.id)) graph.set(node.id, new Set<string>());
  }
  for (const node of nodeById.values()) {
    if (node.unlockRequirementNodeId && nodeById.has(node.unlockRequirementNodeId)) {
      graph.get(node.id)?.add(node.unlockRequirementNodeId);
      graph.get(node.unlockRequirementNodeId)?.add(node.id);
    }
    for (const linkedNodeId of node.pathLinkFromNodeIds) {
      if (!nodeById.has(linkedNodeId)) continue;
      graph.get(node.id)?.add(linkedNodeId);
      graph.get(linkedNodeId)?.add(node.id);
    }
  }

  const queue: string[] = [input.currentNodeId];
  const visited = new Set<string>([input.currentNodeId]);
  const parentById = new Map<string, string | null>([[input.currentNodeId, null]]);
  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) break;
    if (current === input.targetNodeId) break;
    for (const candidate of graph.get(current) ?? []) {
      if (visited.has(candidate)) continue;
      if (!canEnterNode(candidate, current, input, nodeById)) continue;
      const isTarget = candidate === input.targetNodeId;
      if (!isTarget && !isPassableIntermediateNode(candidate, input, nodeById)) continue;
      visited.add(candidate);
      parentById.set(candidate, current);
      queue.push(candidate);
    }
  }

  if (!parentById.has(input.targetNodeId)) return null;
  const reversedPath: string[] = [];
  let cursor: string | null | undefined = input.targetNodeId;
  while (cursor) {
    reversedPath.push(cursor);
    cursor = parentById.get(cursor);
  }
  return reversedPath.reverse();
}
