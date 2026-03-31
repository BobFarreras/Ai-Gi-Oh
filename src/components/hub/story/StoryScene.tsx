// src/components/hub/story/StoryScene.tsx - Escena principal Story con mapa vivo y panel lateral conectado a estado persistible.
"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "zustand";
import { StorySceneDesktopLayout } from "./internal/scene/view/StorySceneDesktopLayout";
import { StorySceneMobileLayout } from "./internal/scene/view/StorySceneMobileLayout";
import { createStorySceneActions } from "./internal/scene/actions/create-story-scene-actions";
import { createStorySceneStore, StorySceneStore } from "./internal/scene/state/story-scene-store";
import { resolveStorySceneCanMove } from "./internal/scene/state/resolve-story-scene-can-move";
import { useStoryNodeInteractionDialog } from "./internal/scene/dialog/use-story-node-interaction-dialog";
import { useStoryInteractionActions } from "./internal/scene/dialog/use-story-interaction-actions";
import { useStorySceneSfx } from "./internal/scene/audio/use-story-scene-sfx";
import { useStoryActEntrySequence } from "./internal/scene/transitions/use-story-act-entry-sequence";
import { useStoryActTransitionNavigation } from "./internal/scene/transitions/use-story-act-transition-navigation";
import { useStoryPostDuelTransition } from "./internal/scene/transitions/use-story-post-duel-transition";
import { useStorySceneMobileMode } from "./internal/scene/view/use-story-scene-mobile-mode";
import { IStoryMapRuntimeData } from "@/services/story/story-map-runtime-data";
import { IStoryChapterBriefing } from "@/services/story/build-story-chapter-briefing";
import { IStoryPostDuelTransition } from "@/services/story/duel-flow/story-post-duel-transition";
import { resolveStoryPrimaryAction } from "@/services/story/resolve-story-primary-action";
import { resolveStorySmartAction } from "@/services/story/resolve-story-smart-action";
import { IStorySceneMapViewProps, IStorySceneSidebarViewProps } from "./internal/scene/view/story-scene-view-props";
interface IStorySceneProps { runtime: IStoryMapRuntimeData; briefing: IStoryChapterBriefing; postDuelTransition?: IStoryPostDuelTransition | null; shouldPlayActEntryAnimation?: boolean; }
interface IStoryCollectVisual { assetSrc: string; assetAlt: string; tone: "NEXUS" | "CARD"; }
export function StoryScene({ runtime, briefing, postDuelTransition = null, shouldPlayActEntryAnimation = false }: IStorySceneProps) {
  const router = useRouter();
  const isMobileLayout = useStorySceneMobileMode();
  const [store] = useState<StorySceneStore>(() => createStorySceneStore({ nodes: runtime.nodes, currentNodeId: runtime.currentNodeId }));
  const selectedNodeId = useStore(store, (state) => state.selectedNodeId);
  const currentNodeId = useStore(store, (state) => state.currentNodeId);
  const nodesById = useStore(store, (state) => state.nodesById);
  const setSelectedNodeId = useStore(store, (state) => state.setSelectedNodeId);
  const setCurrentNodeId = useStore(store, (state) => state.setCurrentNodeId);
  const markNodeCompleted = useStore(store, (state) => state.markNodeCompleted);
  const [isMoving, setIsMoving] = useState(false);
  const [isInteracting, setIsInteracting] = useState(false);
  const [avatarVisualTarget, setAvatarVisualTarget] = useState<{ nodeId: string; stance: "CENTER" | "SIDE" | "PORTAL" } | null>(null);
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
  const interactionDialog = useStoryNodeInteractionDialog();
  const sceneSfx = useStorySceneSfx();
  const { entryAvatarVisualTarget, isActEntrySequenceRunning } = useStoryActEntrySequence({ nodes: runtime.nodes, activeActId: runtime.activeActId, currentNodeId: runtime.currentNodeId, shouldPlayActEntryAnimation });
  const selectedNode = selectedNodeId ? nodesById[selectedNodeId] ?? null : null;
  const sceneNodes = useMemo(() => Object.values(nodesById).sort((left, right) => (left.chapter !== right.chapter ? left.chapter - right.chapter : left.duelIndex - right.duelIndex)), [nodesById]);
  const primaryAction = resolveStoryPrimaryAction(selectedNode);
  const canMoveSelectedNode = resolveStorySceneCanMove({
    selectedNode,
    currentNodeId,
    isInteracting,
    isDialogOpen: interactionDialog.isOpen,
  });
  const smartAction = resolveStorySmartAction({ selectedNode, canMove: canMoveSelectedNode, primaryAction });
  const isBusy = isMoving || isInteracting || isActEntrySequenceRunning || interactionDialog.isOpen || Boolean(actTransitionTargetId);
  useStoryPostDuelTransition({ transition: postDuelTransition, currentNodeId, setAvatarVisualTarget, setRetreatingNodeId });
  const { centerAvatarOnNode, handleSmartAction } = createStorySceneActions({
    selectedNodeId,
    selectedNode,
    currentNodeId,
    nodesById,
    isMoving,
    smartActionMode: smartAction.mode,
    setIsMoving,
    setIsInteracting,
    setMovementError,
    setInteractionFeedback,
    setCurrentNodeId,
    setAvatarVisualTarget,
    setDuelFocusNodeId,
    setFloatingReward,
    setCollectingRewardNodeId,
    setCollectingRewardVisual,
    setPendingCenterNodeId,
    markNodeCompleted,
    sceneSfx,
    navigateTo: router.push,
    requestActTransition: (actId) => setActTransitionTargetId(actId),
    startInteractionDialog: interactionDialog.start,
  });
  useStoryActTransitionNavigation({ actTransitionTargetId, navigateTo: router.push });
  const { finalizeInteractionDialog, advanceInteractionDialog } = useStoryInteractionActions({
    interactionDialog,
    pendingCenterNodeId,
    setPendingCenterNodeId,
    setSelectedNodeId,
    setAvatarVisualTarget,
    playEventFinish: sceneSfx.playEventFinish,
    centerAvatarOnNode,
  });
  const sidebarProps: IStorySceneSidebarViewProps = {
    briefing,
    selectedNode,
    isBusy,
    movementError,
    interactionFeedback,
    smartActionLabel: smartAction.label,
    canRunSmartAction: smartAction.isEnabled && !isBusy,
    onExitToHub: () => {
      sceneSfx.playButtonClick();
      router.push("/hub");
    },
    onSmartAction: () => { sceneSfx.playButtonClick(); void handleSmartAction(); },
    onDeselect: () => { sceneSfx.playButtonClick(); setSelectedNodeId(null); },
  };
  const mapProps: IStorySceneMapViewProps = {
    nodes: sceneNodes,
    currentNodeId,
    selectedNodeId,
    avatarVisualTarget: entryAvatarVisualTarget ?? avatarVisualTarget,
    duelFocusNodeId,
    floatingReward,
    collectingRewardNodeId,
    collectingRewardVisual,
    retreatingNodeId,
    isBusy,
    canMoveSelectedNode,
    actTransitionTargetId,
    shouldPlayActEntryAnimation,
    onSelectNode: (nodeId) => { if (nodeId) sceneSfx.playNodeSelect(); setSelectedNodeId(nodeId); },
    onMoveSelectedNode: () => {
      if (!canMoveSelectedNode || isBusy) return;
      sceneSfx.playButtonClick();
      void handleSmartAction();
    },
    onRequestCenterPlayer: () => {
      sceneSfx.playButtonClick();
      setCenterRequestKey((value) => value + 1);
    },
    onRewardCollectAnimationComplete: () => { setCollectingRewardNodeId(null); setCollectingRewardVisual(null); },
    onRetreatAnimationComplete: () => setRetreatingNodeId(null),
    dialog: {
      isOpen: interactionDialog.isOpen,
      title: interactionDialog.dialogueTitle,
      soundtrackUrl: interactionDialog.soundtrackUrl,
      line: interactionDialog.currentLine,
      onNext: advanceInteractionDialog,
      onClose: finalizeInteractionDialog,
    },
  };
  return isMobileLayout ? <StorySceneMobileLayout sidebar={sidebarProps} map={{ ...mapProps, centerRequestKey }} /> : <StorySceneDesktopLayout sidebar={sidebarProps} map={{ ...mapProps, centerRequestKey }} />;
}
