// src/components/hub/story/internal/scene/dialog/use-story-interaction-actions.ts - Encapsula avance/cierre de diálogo para simplificar la escena principal de Story.
"use client";

import { useCallback } from "react";

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
  setAvatarVisualTarget: (target: { nodeId: string; stance: "CENTER" | "SIDE" | "PORTAL" } | null) => void;
  playEventFinish: () => void;
  centerAvatarOnNode: (nodeId: string) => Promise<void>;
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
  } = input;

  const finalizeInteractionDialog = useCallback(async () => {
    interactionDialog.close();
    if (!pendingCenterNodeId) return;
    playEventFinish();
    setSelectedNodeId(pendingCenterNodeId);
    await centerAvatarOnNode(pendingCenterNodeId);
    setPendingCenterNodeId(null);
    setAvatarVisualTarget(null);
  }, [
    centerAvatarOnNode,
    interactionDialog,
    pendingCenterNodeId,
    playEventFinish,
    setAvatarVisualTarget,
    setPendingCenterNodeId,
    setSelectedNodeId,
  ]);

  const advanceInteractionDialog = useCallback(async () => {
    const shouldFinalize = interactionDialog.isLastLine;
    interactionDialog.next();
    if (shouldFinalize) await finalizeInteractionDialog();
  }, [finalizeInteractionDialog, interactionDialog]);

  return { finalizeInteractionDialog, advanceInteractionDialog };
}
