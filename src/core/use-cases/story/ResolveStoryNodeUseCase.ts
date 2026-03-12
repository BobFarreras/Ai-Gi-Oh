// src/core/use-cases/story/ResolveStoryNodeUseCase.ts - Resuelve completado de nodo Story y recalcula desbloqueos/recompensas.
import { NotFoundError } from "@/core/errors/NotFoundError";
import { ValidationError } from "@/core/errors/ValidationError";
import { IStoryWorldGraph, IStoryWorldProgressState } from "@/core/services/story/world/story-world-types";
import { buildStoryProgressState } from "@/core/use-cases/story/internal/build-story-progress-state";

interface IResolveStoryNodeInput {
  graph: IStoryWorldGraph;
  progress: IStoryWorldProgressState;
  nodeId: string;
  nowIso: string;
}

interface IResolveStoryNodeOutput {
  progress: IStoryWorldProgressState;
  rewardNexus: number;
  rewardPlayerExperience: number;
}

export class ResolveStoryNodeUseCase {
  /**
   * Marca nodo como completado, genera historial y expande desbloqueos.
   */
  execute(input: IResolveStoryNodeInput): IResolveStoryNodeOutput {
    const node = input.graph.nodes.find((entry) => entry.id === input.nodeId);
    if (!node) throw new NotFoundError("Nodo Story no encontrado.", { nodeId: input.nodeId });
    if (!input.progress.unlockedNodeIds.includes(input.nodeId)) {
      throw new ValidationError("No se puede resolver un nodo Story bloqueado.", { nodeId: input.nodeId });
    }
    const completedSet = new Set(input.progress.completedNodeIds);
    completedSet.add(input.nodeId);
    const nextHistory = [
      ...input.progress.history,
      {
        eventId: `resolved-${input.nodeId}-${input.nowIso}`,
        nodeId: input.nodeId,
        kind: "NODE_RESOLVED" as const,
        createdAtIso: input.nowIso,
        details: `Nodo ${node.title} resuelto.`,
      },
    ];
    if (node.rewardNexus > 0 || node.rewardPlayerExperience > 0) {
      nextHistory.push({
        eventId: `reward-${input.nodeId}-${input.nowIso}`,
        nodeId: input.nodeId,
        kind: "REWARD_GRANTED",
        createdAtIso: input.nowIso,
        details: `Recompensa ${node.rewardNexus} NX y ${node.rewardPlayerExperience} EXP.`,
      });
    }
    const progress = buildStoryProgressState({
      graph: input.graph,
      completedNodeIds: [...completedSet],
      currentNodeId: input.progress.currentNodeId,
      history: nextHistory,
    });
    return {
      progress,
      rewardNexus: node.rewardNexus,
      rewardPlayerExperience: node.rewardPlayerExperience,
    };
  }
}
