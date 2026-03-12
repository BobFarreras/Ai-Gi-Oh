// src/core/services/story/world/build-story-world-graph.ts - Construye un grafo Story desde nodos semilla y resuelve desbloqueos por progreso.
import {
  IStoryWorldEdge,
  IStoryWorldGraph,
  IStoryWorldNode,
  StoryWorldSeedNode,
} from "@/core/services/story/world/story-world-types";

function sortSeedNodes(nodes: StoryWorldSeedNode[]): StoryWorldSeedNode[] {
  return [...nodes].sort((left, right) => {
    if (left.chapter !== right.chapter) return left.chapter - right.chapter;
    return left.duelIndex - right.duelIndex;
  });
}

function toWorldNode(node: StoryWorldSeedNode): IStoryWorldNode {
  return {
    id: node.id,
    chapter: node.chapter,
    duelIndex: node.duelIndex,
    title: node.title,
    opponentName: node.opponentName,
    difficulty: node.opponentDifficulty,
    nodeType: node.isBossDuel ? "BOSS" : "DUEL",
    rewardNexus: node.rewardNexus,
    rewardPlayerExperience: node.rewardPlayerExperience,
    unlockRequirementNodeId: node.unlockRequirementDuelId,
    href: `/hub/story/chapter/${node.chapter}/duel/${node.duelIndex}`,
  };
}

/**
 * Crea el grafo base con enlaces explícitos y secuenciales de fallback.
 */
export function buildStoryWorldGraph(seedNodes: StoryWorldSeedNode[]): IStoryWorldGraph {
  const sortedSeedNodes = sortSeedNodes(seedNodes);
  const nodes = sortedSeedNodes.map(toWorldNode);
  const nodeIdSet = new Set(nodes.map((node) => node.id));
  const edgeMap = new Map<string, IStoryWorldEdge>();

  nodes.forEach((node, index) => {
    const previous = nodes[index - 1];
    const fallbackFrom = previous?.id ?? null;
    const explicitFrom = node.unlockRequirementNodeId;
    const fromNodeId =
      explicitFrom && nodeIdSet.has(explicitFrom) ? explicitFrom : fallbackFrom;
    if (!fromNodeId) return;
    const edgeKey = `${fromNodeId}->${node.id}`;
    edgeMap.set(edgeKey, { fromNodeId, toNodeId: node.id });
  });

  return { nodes, edges: [...edgeMap.values()] };
}

/**
 * Resuelve nodos desbloqueados a partir de nodos completados y conexiones del grafo.
 */
export function resolveStoryUnlockedNodeIds(
  graph: IStoryWorldGraph,
  completedNodeIds: string[],
): string[] {
  const completedSet = new Set(completedNodeIds);
  const unlockedSet = new Set<string>();
  const inboundCount = new Map<string, number>();

  for (const node of graph.nodes) inboundCount.set(node.id, 0);
  for (const edge of graph.edges) {
    inboundCount.set(edge.toNodeId, (inboundCount.get(edge.toNodeId) ?? 0) + 1);
  }
  for (const node of graph.nodes) {
    if ((inboundCount.get(node.id) ?? 0) === 0) unlockedSet.add(node.id);
  }
  for (const edge of graph.edges) {
    if (completedSet.has(edge.fromNodeId)) unlockedSet.add(edge.toNodeId);
  }

  return graph.nodes
    .map((node) => node.id)
    .filter((nodeId) => unlockedSet.has(nodeId));
}
