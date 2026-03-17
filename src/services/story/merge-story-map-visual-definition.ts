// src/services/story/merge-story-map-visual-definition.ts - Mezcla runtime Story real con layout editable y nodos virtuales locales.
import { IStoryMapNodeRuntime } from "@/services/story/story-map-runtime-data";
import { listStoryActMapDefinitions } from "@/services/story/map-definitions/story-map-definition-registry";

interface IMergeStoryMapVisualDefinitionInput {
  currentNodeId?: string | null;
  visitedNodeIds?: string[];
  interactedNodeIds?: string[];
}

function resolveVirtualNodeUnlocked(input: {
  dependencyNodeId: string | null;
  nodesById: Map<string, IStoryMapNodeRuntime>;
  currentNodeId: string | null;
}): boolean {
  if (!input.dependencyNodeId) return true;
  const dependencyNode = input.nodesById.get(input.dependencyNodeId);
  if (!dependencyNode) return false;
  if (dependencyNode.nodeType === "MOVE") {
    return dependencyNode.isCompleted || dependencyNode.id === input.currentNodeId;
  }
  return dependencyNode.isCompleted;
}

function resolveNodeUnlocked(input: {
  node: IStoryMapNodeRuntime;
  nodesById: Map<string, IStoryMapNodeRuntime>;
  currentNodeId: string | null;
  visitedNodeIdSet: Set<string>;
  interactedNodeIdSet: Set<string>;
}): boolean {
  if (input.node.id === input.currentNodeId) return true;
  if (input.visitedNodeIdSet.has(input.node.id) || input.node.isCompleted) return true;
  if (!input.node.unlockRequirementNodeId) return input.node.isUnlocked;
  const dependencyNode = input.nodesById.get(input.node.unlockRequirementNodeId);
  if (!dependencyNode) return false;
  if (dependencyNode.nodeType === "MOVE") {
    return (
      dependencyNode.id === input.currentNodeId ||
      dependencyNode.isCompleted ||
      input.visitedNodeIdSet.has(dependencyNode.id)
    );
  }
  return (
    dependencyNode.isCompleted ||
    input.interactedNodeIdSet.has(dependencyNode.id)
  );
}

/**
 * Añade metadatos de layout visual y nodos virtuales al runtime sin tocar reglas de dominio.
 */
export function mergeStoryMapVisualDefinition(
  nodes: IStoryMapNodeRuntime[],
  input: IMergeStoryMapVisualDefinitionInput = {},
): IStoryMapNodeRuntime[] {
  const nextNodes = nodes.map((node) => ({ ...node }));
  const nodeById = new Map(nextNodes.map((node) => [node.id, node]));
  const currentNodeId = input.currentNodeId ?? null;
  const interactedNodeIdSet = new Set(input.interactedNodeIds ?? []);
  const visitedNodeIdSet = new Set(input.visitedNodeIds ?? []);

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
        rewardCardId: virtualNode.rewardCardId,
        rewardPlayerExperience: virtualNode.rewardPlayerExperience,
        isBossDuel: virtualNode.isBossDuel,
        isCompleted:
          virtualNode.nodeType === "MOVE"
            ? visitedNodeIdSet.has(virtualNode.id)
            : interactedNodeIdSet.has(virtualNode.id),
        isUnlocked: resolveVirtualNodeUnlocked({
          dependencyNodeId: virtualNode.unlockRequirementNodeId,
          nodesById: nodeById,
          currentNodeId,
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

  for (const node of nextNodes) {
    // Los nodos visitados o completados deben permanecer seleccionables para permitir retroceso.
    if (visitedNodeIdSet.has(node.id) || node.isCompleted) {
      node.isUnlocked = true;
    }
  }
  for (const node of nextNodes) {
    // Recalcula desbloqueo usando dependencias visuales para imponer secuencia real nodo a nodo.
    node.isUnlocked = resolveNodeUnlocked({
      node,
      nodesById: nodeById,
      currentNodeId,
      visitedNodeIdSet,
      interactedNodeIdSet,
    });
  }

  return nextNodes;
}
