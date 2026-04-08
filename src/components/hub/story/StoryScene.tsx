// src/components/hub/story/StoryScene.tsx - Escena principal Story con mapa vivo y panel lateral conectado a estado persistible.
"use client";
import { useEffect, useMemo, useState } from "react";
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
import { useStoryMapSoundtrack } from "./internal/scene/audio/use-story-map-soundtrack";
import { useStoryActEntrySequence } from "./internal/scene/transitions/use-story-act-entry-sequence";
import { useStoryActTransitionNavigation } from "./internal/scene/transitions/use-story-act-transition-navigation";
import { useStoryPostDuelTransition } from "./internal/scene/transitions/use-story-post-duel-transition";
import { useStorySceneMobileMode } from "./internal/scene/view/use-story-scene-mobile-mode";
import { IStoryMapNodeRuntime, IStoryMapRuntimeData } from "@/services/story/story-map-runtime-data";
import { IStoryChapterBriefing } from "@/services/story/build-story-chapter-briefing";
import { IStoryPostDuelTransition } from "@/services/story/duel-flow/story-post-duel-transition";
import { resolveStoryPrimaryAction } from "@/services/story/resolve-story-primary-action";
import { resolveStorySmartAction } from "@/services/story/resolve-story-smart-action";
import { IStorySceneMapViewProps, IStorySceneSidebarViewProps } from "./internal/scene/view/story-scene-view-props";
import { IStoryAvatarVisualTarget } from "./internal/scene/types/story-avatar-visual-target";
import { resolveStoryNodeSubmissionPrompt } from "@/services/story/story-node-submission-rules";
import { resolveStoryEventNodeVisual, shouldPlayStoryEventCollectAnimation } from "@/services/story/resolve-story-event-node-visual";
type StoryActEntryDirection = "forward" | "backward" | null;
interface IStorySceneProps { runtime: IStoryMapRuntimeData; briefing: IStoryChapterBriefing; postDuelTransition?: IStoryPostDuelTransition | null; shouldPlayActEntryAnimation?: boolean; actEntryDirection?: StoryActEntryDirection; }
interface IStoryCollectVisual { assetSrc: string; assetAlt: string; tone: "NEXUS" | "CARD"; }
interface IStorySubmissionDialogState {
  nodeId: string;
  title: string;
  hint: string;
  placeholder: string;
  activationLabel: string;
  generatedCode: string;
  requiredKeys: Array<{ id: string; label: string; isCollected: boolean }>;
  resolve: (value: string | null) => void;
}
const ACT2_BOSS_DUEL_NODE_ID = "story-ch2-duel-7";
const ACT2_BOSS_POST_WIN_DIALOG_NODE_ID = "story-ch2-duel-7-post-win";
function wait(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}
function buildTransientDialogueNode(input: { id: string; sourceNode: IStoryMapNodeRuntime }): IStoryMapNodeRuntime {
  return {
    ...input.sourceNode,
    id: input.id,
    title: input.sourceNode.title,
    href: "#",
  };
}
export function StoryScene({ runtime, briefing, postDuelTransition = null, shouldPlayActEntryAnimation = false, actEntryDirection = null }: IStorySceneProps) {
  const router = useRouter();
  const isMobileLayout = useStorySceneMobileMode();
  const [store] = useState<StorySceneStore>(() => createStorySceneStore({ nodes: runtime.nodes, currentNodeId: runtime.currentNodeId }));
  useEffect(() => {
    store.getState().hydrateFromRuntime({ nodes: runtime.nodes, currentNodeId: runtime.currentNodeId });
  }, [store, runtime.activeActId, runtime.currentNodeId, runtime.nodes]);
  const selectedNodeId = useStore(store, (state) => state.selectedNodeId);
  const currentNodeId = useStore(store, (state) => state.currentNodeId);
  const nodesById = useStore(store, (state) => state.nodesById);
  const setSelectedNodeId = useStore(store, (state) => state.setSelectedNodeId);
  const setCurrentNodeId = useStore(store, (state) => state.setCurrentNodeId);
  const markNodeCompleted = useStore(store, (state) => state.markNodeCompleted);
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
  const interactionDialog = useStoryNodeInteractionDialog();
  const sceneSfx = useStorySceneSfx();
  const { isMuted: isMapSoundtrackMuted, toggleMute: toggleMapSoundtrackMute } = useStoryMapSoundtrack(runtime.activeActId);
  const { entryAvatarVisualTarget, isActEntrySequenceRunning, entryResolvedNodeId } = useStoryActEntrySequence({
    nodes: runtime.nodes,
    activeActId: runtime.activeActId,
    currentNodeId: runtime.currentNodeId,
    shouldPlayActEntryAnimation,
    direction: actEntryDirection,
  });
  useEffect(() => {
    if (!entryResolvedNodeId) return;
    setCurrentNodeId(entryResolvedNodeId);
    setSelectedNodeId(entryResolvedNodeId);
  }, [entryResolvedNodeId, setCurrentNodeId, setSelectedNodeId]);
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
  const shouldDelayBossRetreatForPostDialogue =
    postDuelTransition?.outcome === "WON" && postDuelTransition.duelNodeId === ACT2_BOSS_DUEL_NODE_ID;
  useStoryPostDuelTransition({
    transition: shouldDelayBossRetreatForPostDialogue ? null : postDuelTransition,
    currentNodeId,
    setAvatarVisualTarget,
    setRetreatingNodeId,
  });
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
    requestNodeSubmission: async (nodeId) => {
      const prompt = resolveStoryNodeSubmissionPrompt(nodeId);
      if (!prompt) return null;
      return await new Promise<string | null>((resolve) => {
        setSubmissionDialog({
          nodeId,
          title: prompt.title,
          hint: prompt.hint,
          placeholder: prompt.placeholder,
          activationLabel: prompt.activationLabel,
          generatedCode: prompt.generatedCode,
          requiredKeys: prompt.requiredNodeIds.map((requiredNodeId) => ({
            id: requiredNodeId,
            label: nodesById[requiredNodeId]?.title ?? requiredNodeId,
            isCollected: Boolean(nodesById[requiredNodeId]?.isCompleted),
          })),
          resolve,
        });
      });
    },
    hasSeenPreDuelDialogue: (nodeId) => preDuelDialogSeenNodeIds.includes(nodeId),
    markPreDuelDialogueSeen: (nodeId) =>
      setPreDuelDialogSeenNodeIds((prev) => (prev.includes(nodeId) ? prev : [...prev, nodeId])),
    scheduleAutoStartDuelAfterDialogue: (nodeId) => setPendingAutoStartDuelNodeId(nodeId),
  });
  useStoryActTransitionNavigation({
    actTransitionTargetId,
    activeActId: runtime.activeActId,
    navigateTo: router.push,
    clearTransition: () => setActTransitionTargetId(null),
  });
  useEffect(() => {
    if (!shouldDelayBossRetreatForPostDialogue || !postDuelTransition) return;
    if (consumedPostBossWinTransitionIds.includes(postDuelTransition.returnNodeId)) return;
    const sourceNode = nodesById[ACT2_BOSS_DUEL_NODE_ID];
    if (!sourceNode || interactionDialog.isOpen) return;
    const opened = interactionDialog.start(
      buildTransientDialogueNode({ id: ACT2_BOSS_POST_WIN_DIALOG_NODE_ID, sourceNode }),
      1,
    );
    if (!opened) {
      window.setTimeout(() => {
        setRetreatingNodeId(ACT2_BOSS_DUEL_NODE_ID);
        setConsumedPostBossWinTransitionIds((prev) => [...prev, postDuelTransition.returnNodeId]);
      }, 0);
      return;
    }
    window.setTimeout(() => {
      setPendingPostWinRetreatNodeId(ACT2_BOSS_DUEL_NODE_ID);
      setConsumedPostBossWinTransitionIds((prev) => [...prev, postDuelTransition.returnNodeId]);
    }, 0);
  }, [
    consumedPostBossWinTransitionIds,
    interactionDialog,
    nodesById,
    postDuelTransition,
    shouldDelayBossRetreatForPostDialogue,
  ]);
  const { finalizeInteractionDialog, advanceInteractionDialog } = useStoryInteractionActions({
    interactionDialog,
    pendingCenterNodeId,
    setPendingCenterNodeId,
    setSelectedNodeId,
    setAvatarVisualTarget,
    playEventFinish: sceneSfx.playEventFinish,
    centerAvatarOnNode,
    shouldPlayCollectAnimationForNode: shouldPlayStoryEventCollectAnimation,
    playCollectAnimationForNode: async (nodeId) => {
      if (!shouldPlayStoryEventCollectAnimation(nodeId)) return;
      const eventVisual = resolveStoryEventNodeVisual(nodeId);
      setCollectingRewardNodeId(nodeId);
      setCollectingRewardVisual({
        assetSrc: eventVisual.assetSrc,
        assetAlt: eventVisual.assetAlt,
        tone: "CARD",
      });
      await wait(620);
    },
    onAfterFinalize: async () => {
      if (pendingAutoStartDuelNodeId) {
        const duelNode = nodesById[pendingAutoStartDuelNodeId];
        if (duelNode) {
          setDuelFocusNodeId(duelNode.id);
          sceneSfx.playDuelStart();
          await wait(520);
          router.push(duelNode.href);
        }
        setPendingAutoStartDuelNodeId(null);
        return;
      }
      if (!pendingPostWinRetreatNodeId) return;
      setRetreatingNodeId(pendingPostWinRetreatNodeId);
      setPendingPostWinRetreatNodeId(null);
    },
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
    isSoundtrackMuted: isMapSoundtrackMuted,
    onToggleSoundtrackMute: () => {
      sceneSfx.playButtonClick();
      toggleMapSoundtrackMute();
    },
    onRewardCollectAnimationComplete: () => { setCollectingRewardNodeId(null); setCollectingRewardVisual(null); },
    onRetreatAnimationComplete: () => setRetreatingNodeId(null),
    dialog: {
      isOpen: interactionDialog.isOpen,
      title: interactionDialog.dialogueTitle,
      cinematicVideo: interactionDialog.cinematicVideo,
      line: interactionDialog.currentLine,
      onNext: advanceInteractionDialog,
      onClose: finalizeInteractionDialog,
    },
    submission: {
      isOpen: Boolean(submissionDialog),
      title: submissionDialog?.title ?? "Submission",
      hint: submissionDialog?.hint ?? "",
      placeholder: submissionDialog?.placeholder ?? "",
      activationLabel: submissionDialog?.activationLabel ?? "Conectar",
      generatedCode: submissionDialog?.generatedCode ?? "",
      requiredKeys: submissionDialog?.requiredKeys ?? [],
      onCancel: () => {
        if (!submissionDialog) return;
        submissionDialog.resolve(null);
        setSubmissionDialog(null);
      },
      onSubmit: (value) => {
        if (!submissionDialog) return;
        submissionDialog.resolve(value);
        setSubmissionDialog(null);
      },
    },
  };
  return isMobileLayout ? <StorySceneMobileLayout sidebar={sidebarProps} map={{ ...mapProps, centerRequestKey }} /> : <StorySceneDesktopLayout sidebar={sidebarProps} map={{ ...mapProps, centerRequestKey }} />;
}


