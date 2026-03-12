// src/core/use-cases/story/MoveToStoryNodeUseCase.ts - Valida y aplica movimiento entre nodos conectados del mundo Story.
import { NotFoundError } from "@/core/errors/NotFoundError";
import { ValidationError } from "@/core/errors/ValidationError";
import { canMoveBetweenStoryNodes } from "@/core/services/story/world/story-world-navigation";
import { assertValidStoryNodeId } from "@/core/use-cases/story/internal/assert-valid-story-node-id";
import { IStoryWorldGraph, IStoryWorldProgressState } from "@/core/services/story/world/story-world-types";

interface IMoveToStoryNodeInput {
  graph: IStoryWorldGraph;
  progress: IStoryWorldProgressState;
  toNodeId: string;
  nowIso: string;
}

export class MoveToStoryNodeUseCase {
  /**
   * Mueve el cursor Story únicamente si el nodo destino está desbloqueado y conectado.
   */
  execute(input: IMoveToStoryNodeInput): IStoryWorldProgressState {
    assertValidStoryNodeId(input.toNodeId);
    const targetNode = input.graph.nodes.find((node) => node.id === input.toNodeId);
    if (!targetNode) throw new NotFoundError("Nodo Story no encontrado.", { nodeId: input.toNodeId });
    const canMove = canMoveBetweenStoryNodes({
      graph: input.graph,
      fromNodeId: input.progress.currentNodeId,
      toNodeId: input.toNodeId,
      unlockedNodeIds: input.progress.unlockedNodeIds,
    });
    if (!canMove) {
      throw new ValidationError("No se puede mover al nodo Story destino.", {
        fromNodeId: input.progress.currentNodeId,
        toNodeId: input.toNodeId,
      });
    }
    return {
      ...input.progress,
      currentNodeId: input.toNodeId,
      history: [
        ...input.progress.history,
        {
          eventId: `move-${input.toNodeId}-${input.nowIso}`,
          nodeId: input.toNodeId,
          kind: "MOVE",
          createdAtIso: input.nowIso,
          details: `Movimiento a nodo ${targetNode.title}.`,
        },
      ],
    };
  }
}
