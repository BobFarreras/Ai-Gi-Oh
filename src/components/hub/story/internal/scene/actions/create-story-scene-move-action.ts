// src/components/hub/story/internal/scene/actions/create-story-scene-move-action.ts - Construye el handler de movimiento Story con sincronización visual y callback de acción posterior.
import { animateStoryAvatarPath } from "@/components/hub/story/internal/scene/actions/animate-story-avatar-path";
import { IStoryMapNodeRuntime } from "@/services/story/story-map-runtime-data";
import { ICreateStorySceneActionsParams } from "./story-scene-action-types";
import { readApiErrorMessage, wait } from "./story-scene-action-helpers";

/**
 * Ejecuta desplazamiento entre nodos y opcionalmente encadena acción primaria al finalizar.
 */
export function createStorySceneMoveAction(input: {
  params: ICreateStorySceneActionsParams;
  runPrimaryActionAfterMove: (targetNode: IStoryMapNodeRuntime) => Promise<void>;
}) {
  return async (triggerActionAfterMove = false, targetNodeForAction: IStoryMapNodeRuntime | null = input.params.selectedNode): Promise<void> => {
    if (!input.params.selectedNodeId || input.params.isMoving) return;
    input.params.setIsMoving(true);
    input.params.setMovementError(null);
    input.params.setInteractionFeedback(null);
    try {
      const response = await fetch("/api/story/world/move", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ nodeId: input.params.selectedNodeId }),
      });
      if (!response.ok) {
        throw new Error(await readApiErrorMessage(response, "No se pudo mover al nodo seleccionado."));
      }
      const payload = (await response.json()) as { currentNodeId: string | null; pathNodeIds?: string[] };
      const travelPathNodeIds = payload.pathNodeIds ?? (payload.currentNodeId ? [payload.currentNodeId] : []);
      if (travelPathNodeIds.length > 0) {
        input.params.sceneSfx.playMove();
        await animateStoryAvatarPath({
          pathNodeIds: travelPathNodeIds,
          startNodeId: input.params.currentNodeId,
          nodesById: input.params.nodesById,
          setCurrentNodeId: input.params.setCurrentNodeId,
          setAvatarVisualTarget: input.params.setAvatarVisualTarget,
          wait,
        });
      }
      await wait(420);
      if (triggerActionAfterMove && targetNodeForAction && targetNodeForAction.nodeType !== "MOVE") {
        await input.runPrimaryActionAfterMove(targetNodeForAction);
      }
    } catch (error) {
      input.params.setMovementError(
        error instanceof Error ? error.message : "No se pudo mover al nodo seleccionado.",
      );
    } finally {
      input.params.setIsMoving(false);
    }
  };
}

