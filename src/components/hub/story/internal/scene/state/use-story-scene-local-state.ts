// src/components/hub/story/internal/scene/state/use-story-scene-local-state.ts - Encapsula estado local efímero de StoryScene para evitar crecimiento del componente principal.
"use client";

import { useState } from "react";
import { IStoryAvatarVisualTarget } from "@/components/hub/story/internal/scene/types/story-avatar-visual-target";
import { IStoryCollectVisual, IStorySubmissionDialogState } from "@/components/hub/story/internal/scene/types/story-scene-local-types";

/**
 * Centraliza banderas UI transitorias (animaciones, feedback, overlays y diálogos).
 */
export function useStorySceneLocalState() {
  const [isMoving, setIsMoving] = useState(false);
  const [isInteracting, setIsInteracting] = useState(false);
  const [avatarVisualTarget, setAvatarVisualTarget] = useState<IStoryAvatarVisualTarget | null>(null);
  const [duelFocusNodeId, setDuelFocusNodeId] = useState<string | null>(null);
  const [floatingReward, setFloatingReward] = useState<{ label: string; tone: "NEXUS" | "CARD" } | null>(null);
  const [collectingRewardNodeId, setCollectingRewardNodeId] = useState<string | null>(null);
  const [collectingRewardVisual, setCollectingRewardVisual] = useState<IStoryCollectVisual | null>(null);
  const [retreatingNodeId, setRetreatingNodeId] = useState<string | null>(null);
  const [actTransitionTargetId, setActTransitionTargetId] = useState<number | null>(null);
  const [centerRequestKey, setCenterRequestKey] = useState(0);
  const [pendingCenterNodeId, setPendingCenterNodeId] = useState<string | null>(null);
  const [movementError, setMovementError] = useState<string | null>(null);
  const [interactionFeedback, setInteractionFeedback] = useState<string | null>(null);
  const [submissionDialog, setSubmissionDialog] = useState<IStorySubmissionDialogState | null>(null);
  const [preDuelDialogSeenNodeIds, setPreDuelDialogSeenNodeIds] = useState<string[]>([]);
  const [pendingAutoStartDuelNodeId, setPendingAutoStartDuelNodeId] = useState<string | null>(null);
  const [pendingPostWinRetreatNodeId, setPendingPostWinRetreatNodeId] = useState<string | null>(null);
  const [consumedPostBossWinTransitionIds, setConsumedPostBossWinTransitionIds] = useState<string[]>([]);

  return {
    isMoving,
    isInteracting,
    avatarVisualTarget,
    duelFocusNodeId,
    floatingReward,
    collectingRewardNodeId,
    collectingRewardVisual,
    retreatingNodeId,
    actTransitionTargetId,
    centerRequestKey,
    pendingCenterNodeId,
    movementError,
    interactionFeedback,
    submissionDialog,
    preDuelDialogSeenNodeIds,
    pendingAutoStartDuelNodeId,
    pendingPostWinRetreatNodeId,
    consumedPostBossWinTransitionIds,
    setIsMoving,
    setIsInteracting,
    setAvatarVisualTarget,
    setDuelFocusNodeId,
    setFloatingReward,
    setCollectingRewardNodeId,
    setCollectingRewardVisual,
    setRetreatingNodeId,
    setActTransitionTargetId,
    setCenterRequestKey,
    setPendingCenterNodeId,
    setMovementError,
    setInteractionFeedback,
    setSubmissionDialog,
    setPreDuelDialogSeenNodeIds,
    setPendingAutoStartDuelNodeId,
    setPendingPostWinRetreatNodeId,
    setConsumedPostBossWinTransitionIds,
  };
}

