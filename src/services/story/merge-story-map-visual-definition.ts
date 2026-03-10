// src/services/story/merge-story-map-visual-definition.ts - Mezcla runtime Story real con layout editable y nodos virtuales locales.
import { IStoryMapNodeRuntime } from "@/services/story/story-map-runtime-data";
import { listStoryActMapDefinitions } from "@/services/story/map-definitions/story-map-definition-registry";
import { IPlayerStoryHistoryEvent } from "@/core/entities/story/IPlayerStoryHistoryEvent";

function resolveVirtualNodeUnlocked(input: {
  dependencyNodeId: string | null;
  nodesById: Map<string, IStoryMapNodeRuntime>;
}): boolean {
  if (!input.dependencyNodeId) return true;
  const dependencyNode = input.nodesById.get(input.dependencyNodeId);
  if (!dependencyNode) return false;
  return dependencyNode.isCompleted;
}

/**
 * Añade metadatos de layout visual y nodos virtuales al runtime sin tocar reglas de dominio.
 */
export function mergeStoryMapVisualDefinition(
  nodes: IStoryMapNodeRuntime[],
  history: IPlayerStoryHistoryEvent[] = [],
): IStoryMapNodeRuntime[] {
  const nextNodes = nodes.map((node) => ({ ...node }));
  const nodeById = new Map(nextNodes.map((node) => [node.id, node]));
  const interactedNodeIdSet = new Set(
    history.filter((event) => event.kind === "INTERACTION").map((event) => event.nodeId),
  );

  for (const actDefinition of listStoryActMapDefinitions()) {
    for (const visualNode of actDefinition.nodes) {
      const runtimeNode = nodeById.get(visualNode.id);
      if (!runtimeNode) continue;
      runtimeNode.unlockRequirementNodeId = visualNode.unlockRequirementNodeId ?? runtimeNode.unlockRequirementNodeId;
      runtimeNode.pathLinkFromNodeIds = visualNode.pathLinkFromNodeIds;
      runtimeNode.position = visualNode.position;
    }
  }

  for (const actDefinition of listStoryActMapDefinitions()) {
    const virtualNodes = actDefinition.virtualNodes ?? [];
    for (const virtualNode of virtualNodes) {
      if (nodeById.has(virtualNode.id)) continue;
      const runtimeVirtualNode: IStoryMapNodeRuntime = {
        id: virtualNode.id,
        chapter: virtualNode.chapter,
        duelIndex: virtualNode.duelIndex,
        title: virtualNode.title,
        opponentName: virtualNode.opponentName,
        nodeType: virtualNode.nodeType,
        difficulty: virtualNode.difficulty,
        rewardNexus: virtualNode.rewardNexus,
        rewardPlayerExperience: virtualNode.rewardPlayerExperience,
        isBossDuel: virtualNode.isBossDuel,
        isCompleted: interactedNodeIdSet.has(virtualNode.id),
        isUnlocked: resolveVirtualNodeUnlocked({
          dependencyNodeId: virtualNode.unlockRequirementNodeId,
          nodesById: nodeById,
        }),
        unlockRequirementNodeId: virtualNode.unlockRequirementNodeId,
        pathLinkFromNodeIds: virtualNode.pathLinkFromNodeIds,
        href: virtualNode.href,
        isVirtualNode: true,
        position: virtualNode.position,
      };
      nextNodes.push(runtimeVirtualNode);
      nodeById.set(runtimeVirtualNode.id, runtimeVirtualNode);
    }
  }

  return nextNodes;
}
