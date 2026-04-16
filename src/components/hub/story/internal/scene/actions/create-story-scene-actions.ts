// src/components/hub/story/internal/scene/actions/create-story-scene-actions.ts - Factoría de handlers Story compuesta con acciones especializadas de movimiento e interacción.
import { IStoryMapNodeRuntime } from "@/services/story/story-map-runtime-data";
import { createStorySceneMoveAction } from "./create-story-scene-move-action";
import { createStoryScenePrimaryAction } from "./create-story-scene-primary-action";
import { ICreateStorySceneActionsParams, StoryRewardTone } from "./story-scene-action-types";
import { resolveCollectVisual, wait } from "./story-scene-action-helpers";

/**
 * Compone la API de acciones de StoryScene sin concentrar la lógica en un módulo GOD.
 */
export function createStorySceneActions(params: ICreateStorySceneActionsParams) {
  const showFloatingReward = (label: string, tone: StoryRewardTone): void => {
    params.setFloatingReward({ label, tone });
    window.setTimeout(() => params.setFloatingReward(null), 620);
  };
  const runRewardCollectAnimation = async (targetNode: IStoryMapNodeRuntime): Promise<void> => {
    params.setCollectingRewardNodeId(targetNode.id);
    params.setCollectingRewardVisual(resolveCollectVisual(targetNode));
    await wait(620);
  };
  const centerAvatarOnNode = async (nodeId: string): Promise<void> => {
    params.setCurrentNodeId(nodeId);
    params.setAvatarVisualTarget({ nodeId, stance: "CENTER" });
    await wait(220);
  };
  const portalAvatarOnNode = async (nodeId: string): Promise<void> => {
    await centerAvatarOnNode(nodeId);
    params.setAvatarVisualTarget({ nodeId, stance: "PORTAL" });
    await wait(240);
  };

  const handleMove = async (triggerActionAfterMove?: boolean, targetNodeForAction?: IStoryMapNodeRuntime | null) => {
    await handleMoveInternal(triggerActionAfterMove, targetNodeForAction);
  };
  const handlePrimaryAction = createStoryScenePrimaryAction({
    params,
    handleMove: async (triggerActionAfterMove, targetNodeForAction) => {
      await handleMove(triggerActionAfterMove, targetNodeForAction);
    },
    api: {
      showFloatingReward,
      runRewardCollectAnimation,
      centerAvatarOnNode,
      portalAvatarOnNode,
    },
  });
  const handleMoveInternal = createStorySceneMoveAction({
    params,
    runPrimaryActionAfterMove: async (targetNode) => {
      await handlePrimaryAction(targetNode, true);
    },
  });

  const handleSmartAction = async (): Promise<void> => {
    if (params.smartActionMode === "MOVE") return handleMove(false);
    if (params.smartActionMode === "PRIMARY") return handlePrimaryAction();
    if (params.smartActionMode === "MOVE_AND_PRIMARY") return handleMove(true);
  };

  return {
    centerAvatarOnNode,
    handleMove,
    handlePrimaryAction,
    handleSmartAction,
  };
}
