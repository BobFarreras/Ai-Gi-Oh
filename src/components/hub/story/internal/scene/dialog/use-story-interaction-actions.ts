// src/components/hub/story/internal/scene/dialog/use-story-interaction-actions.ts - Encapsula avance/cierre de diálogo para simplificar la escena principal de Story.
"use client";

import { useCallback } from "react";
import { IStoryAvatarVisualTarget } from "@/components/hub/story/internal/scene/types/story-avatar-visual-target";

interface IStoryInteractionDialogApi {
  isLastLine: boolean;
  next: () => void;
  close: () => void;
}

interface IUseStoryInteractionActionsInput {
  interactionDialog: IStoryInteractionDialogApi;
  pendingCenterNodeId: string | null;
  setPendingCenterNodeId: (nodeId: string | null) => void;
  setSelectedNodeId: (nodeId: string | null) => void;
  setAvatarVisualTarget: (target: IStoryAvatarVisualTarget | null) => void;
  playEventFinish: () => void;
  centerAvatarOnNode: (nodeId: string) => Promise<void>;
  shouldPlayCollectAnimationForNode: (nodeId: string) => boolean;
  playCollectAnimationForNode: (nodeId: string) => Promise<void>;
  onAfterFinalize?: () => Promise<void> | void;
}

interface IUseStoryInteractionActionsOutput {
  finalizeInteractionDialog: () => Promise<void>;
  advanceInteractionDialog: () => Promise<void>;
}

/**
 * Coordina cierre de diálogo + centrado de avatar para evitar duplicación en StoryScene.
 */
export function useStoryInteractionActions(input: IUseStoryInteractionActionsInput): IUseStoryInteractionActionsOutput {
  const {
    interactionDialog,
    pendingCenterNodeId,
    setPendingCenterNodeId,
    setSelectedNodeId,
    setAvatarVisualTarget,
    playEventFinish,
    centerAvatarOnNode,
    shouldPlayCollectAnimationForNode,
    playCollectAnimationForNode,
    onAfterFinalize,
  } = input;

  const finalizeInteractionDialog = useCallback(async () => {
    interactionDialog.close();
    if (pendingCenterNodeId) {
      playEventFinish();
      setSelectedNodeId(pendingCenterNodeId);
      if (shouldPlayCollectAnimationForNode(pendingCenterNodeId)) {
        await playCollectAnimationForNode(pendingCenterNodeId);
      }
      await centerAvatarOnNode(pendingCenterNodeId);
      setPendingCenterNodeId(null);
      setAvatarVisualTarget(null);
    }
    await onAfterFinalize?.();
  }, [
    centerAvatarOnNode,
    interactionDialog,
    pendingCenterNodeId,
    playCollectAnimationForNode,
    playEventFinish,
    onAfterFinalize,
    setAvatarVisualTarget,
    setPendingCenterNodeId,
    setSelectedNodeId,
    shouldPlayCollectAnimationForNode,
  ]);

  const advanceInteractionDialog = useCallback(async () => {
    const shouldFinalize = interactionDialog.isLastLine;
    interactionDialog.next();
    if (shouldFinalize) await finalizeInteractionDialog();
  }, [finalizeInteractionDialog, interactionDialog]);

  return { finalizeInteractionDialog, advanceInteractionDialog };
}
