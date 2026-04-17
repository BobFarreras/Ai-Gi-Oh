// src/components/hub/story/StoryScene.tsx - Escena Story principal orquestando estado local, acciones narrativas y layouts desktop/mobile.
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "zustand";
import { StorySceneDesktopLayout } from "./internal/scene/view/StorySceneDesktopLayout";
import { StorySceneMobileLayout } from "./internal/scene/view/StorySceneMobileLayout";
import { createStorySceneActions } from "./internal/scene/actions/create-story-scene-actions";
import { createStorySceneStore, StorySceneStore } from "./internal/scene/state/story-scene-store";
import { resolveStorySceneCanMove } from "./internal/scene/state/resolve-story-scene-can-move";
import { useStorySceneLocalState } from "./internal/scene/state/use-story-scene-local-state";
import { useStoryNodeInteractionDialog } from "./internal/scene/dialog/use-story-node-interaction-dialog";
import { useStoryInteractionActions } from "./internal/scene/dialog/use-story-interaction-actions";
import { useStorySceneSfx } from "./internal/scene/audio/use-story-scene-sfx";
import { useStoryMapSoundtrack } from "./internal/scene/audio/use-story-map-soundtrack";
import { useStoryActEntrySequence } from "./internal/scene/transitions/use-story-act-entry-sequence";
import { useStoryActTransitionNavigation } from "./internal/scene/transitions/use-story-act-transition-navigation";
import { useStoryPostDuelTransition } from "./internal/scene/transitions/use-story-post-duel-transition";
import { useStoryPostBossWinDialogue } from "./internal/scene/effects/use-story-post-boss-win-dialogue";
import { useStorySceneMobileMode } from "./internal/scene/view/use-story-scene-mobile-mode";
import { buildStorySceneSidebarProps } from "./internal/scene/view/build-story-scene-sidebar-props";
import { buildStorySceneMapProps } from "./internal/scene/view/build-story-scene-map-props";
import { IStoryMapRuntimeData } from "@/services/story/story-map-runtime-data";
import { IStoryChapterBriefing } from "@/services/story/build-story-chapter-briefing";
import { IStoryPostDuelTransition } from "@/services/story/duel-flow/story-post-duel-transition";
import { resolveStoryPrimaryAction } from "@/services/story/resolve-story-primary-action";
import { resolveStorySmartAction } from "@/services/story/resolve-story-smart-action";
import { resolveStoryNodeSubmissionPrompt } from "@/services/story/story-node-submission-rules";
import { resolveStoryEventNodeVisual, shouldPlayStoryEventCollectAnimation } from "@/services/story/resolve-story-event-node-visual";

type StoryActEntryDirection = "forward" | "backward" | null;
interface IStorySceneProps { runtime: IStoryMapRuntimeData; briefing: IStoryChapterBriefing; postDuelTransition?: IStoryPostDuelTransition | null; shouldPlayActEntryAnimation?: boolean; actEntryDirection?: StoryActEntryDirection; }
function wait(ms: number): Promise<void> { return new Promise((resolve) => window.setTimeout(resolve, ms)); }

export function StoryScene({ runtime, briefing, postDuelTransition = null, shouldPlayActEntryAnimation = false, actEntryDirection = null }: IStorySceneProps) {
  const router = useRouter();
  const local = useStorySceneLocalState();
  const interactionDialog = useStoryNodeInteractionDialog();
  const sceneSfx = useStorySceneSfx();
  const isMobileLayout = useStorySceneMobileMode();
  const { isMuted: isMapSoundtrackMuted, toggleMute: toggleMapSoundtrackMute } = useStoryMapSoundtrack(runtime.activeActId);
  const [store] = useState<StorySceneStore>(() => createStorySceneStore({ nodes: runtime.nodes, currentNodeId: runtime.currentNodeId }));

  useEffect(() => { store.getState().hydrateFromRuntime({ nodes: runtime.nodes, currentNodeId: runtime.currentNodeId }); }, [store, runtime.activeActId, runtime.currentNodeId, runtime.nodes]);
  const selectedNodeId = useStore(store, (state) => state.selectedNodeId);
  const currentNodeId = useStore(store, (state) => state.currentNodeId);
  const nodesById = useStore(store, (state) => state.nodesById);
  const setSelectedNodeId = useStore(store, (state) => state.setSelectedNodeId);
  const setCurrentNodeId = useStore(store, (state) => state.setCurrentNodeId);
  const markNodeCompleted = useStore(store, (state) => state.markNodeCompleted);

  const { entryAvatarVisualTarget, isActEntrySequenceRunning, entryResolvedNodeId } = useStoryActEntrySequence({ nodes: runtime.nodes, activeActId: runtime.activeActId, currentNodeId: runtime.currentNodeId, shouldPlayActEntryAnimation, direction: actEntryDirection });
  useEffect(() => { if (!entryResolvedNodeId) return; setCurrentNodeId(entryResolvedNodeId); setSelectedNodeId(entryResolvedNodeId); }, [entryResolvedNodeId, setCurrentNodeId, setSelectedNodeId]);

  const selectedNode = selectedNodeId ? nodesById[selectedNodeId] ?? null : null;
  const sceneNodes = useMemo(() => Object.values(nodesById).sort((left, right) => (left.chapter !== right.chapter ? left.chapter - right.chapter : left.duelIndex - right.duelIndex)), [nodesById]);
  const primaryAction = resolveStoryPrimaryAction(selectedNode);
  const canMoveSelectedNode = resolveStorySceneCanMove({ selectedNode, currentNodeId, isInteracting: local.isInteracting, isDialogOpen: interactionDialog.isOpen });
  const smartAction = resolveStorySmartAction({ selectedNode, canMove: canMoveSelectedNode, primaryAction });
  const isBusy = local.isMoving || local.isInteracting || isActEntrySequenceRunning || interactionDialog.isOpen || Boolean(local.actTransitionTargetId);
  const shouldDelayBossRetreatForPostDialogue = postDuelTransition?.outcome === "WON" && postDuelTransition.duelNodeId === "story-ch2-duel-7";

  useStoryPostDuelTransition({ transition: shouldDelayBossRetreatForPostDialogue ? null : postDuelTransition, currentNodeId, setAvatarVisualTarget: local.setAvatarVisualTarget, setRetreatingNodeId: local.setRetreatingNodeId });
  useStoryPostBossWinDialogue({
    postDuelTransition: shouldDelayBossRetreatForPostDialogue ? postDuelTransition : null,
    nodesById,
    isDialogOpen: interactionDialog.isOpen,
    consumedTransitionIds: local.consumedPostBossWinTransitionIds,
    setConsumedTransitionIds: local.setConsumedPostBossWinTransitionIds,
    setPendingRetreatNodeId: local.setPendingPostWinRetreatNodeId,
    setRetreatingNodeId: local.setRetreatingNodeId,
    startInteractionDialog: interactionDialog.start,
  });

  const { centerAvatarOnNode, handleSmartAction } = createStorySceneActions({
    selectedNodeId, selectedNode, currentNodeId, nodesById, isMoving: local.isMoving, smartActionMode: smartAction.mode, setIsMoving: local.setIsMoving, setIsInteracting: local.setIsInteracting, setMovementError: local.setMovementError, setInteractionFeedback: local.setInteractionFeedback, setCurrentNodeId, setAvatarVisualTarget: local.setAvatarVisualTarget, setDuelFocusNodeId: local.setDuelFocusNodeId, setFloatingReward: local.setFloatingReward, setCollectingRewardNodeId: local.setCollectingRewardNodeId, setCollectingRewardVisual: local.setCollectingRewardVisual, setPendingCenterNodeId: local.setPendingCenterNodeId, markNodeCompleted, sceneSfx, navigateTo: router.push, requestActTransition: local.setActTransitionTargetId, startInteractionDialog: interactionDialog.start,
    requestNodeSubmission: async (nodeId) => {
      const prompt = resolveStoryNodeSubmissionPrompt(nodeId); if (!prompt) return null;
      return await new Promise<string | null>((resolve) => local.setSubmissionDialog({ nodeId, title: prompt.title, hint: prompt.hint, placeholder: prompt.placeholder, activationLabel: prompt.activationLabel, generatedCode: prompt.generatedCode, requiredKeys: prompt.requiredNodeIds.map((requiredNodeId) => ({ id: requiredNodeId, label: nodesById[requiredNodeId]?.title ?? requiredNodeId, isCollected: Boolean(nodesById[requiredNodeId]?.isCompleted) })), resolve }));
    },
    hasSeenPreDuelDialogue: (nodeId) => local.preDuelDialogSeenNodeIds.includes(nodeId),
    markPreDuelDialogueSeen: (nodeId) => local.setPreDuelDialogSeenNodeIds((prev) => (prev.includes(nodeId) ? prev : [...prev, nodeId])),
    scheduleAutoStartDuelAfterDialogue: local.setPendingAutoStartDuelNodeId,
  });

  useStoryActTransitionNavigation({ actTransitionTargetId: local.actTransitionTargetId, activeActId: runtime.activeActId, navigateTo: router.push, clearTransition: () => local.setActTransitionTargetId(null) });
  const { finalizeInteractionDialog, advanceInteractionDialog } = useStoryInteractionActions({
    interactionDialog, pendingCenterNodeId: local.pendingCenterNodeId, setPendingCenterNodeId: local.setPendingCenterNodeId, setSelectedNodeId, setAvatarVisualTarget: local.setAvatarVisualTarget, playEventFinish: sceneSfx.playEventFinish, centerAvatarOnNode, shouldPlayCollectAnimationForNode: shouldPlayStoryEventCollectAnimation,
    playCollectAnimationForNode: async (nodeId) => { if (!shouldPlayStoryEventCollectAnimation(nodeId)) return; const eventVisual = resolveStoryEventNodeVisual(nodeId); local.setCollectingRewardNodeId(nodeId); local.setCollectingRewardVisual({ assetSrc: eventVisual.assetSrc, assetAlt: eventVisual.assetAlt, tone: "CARD" }); await wait(620); },
    onAfterFinalize: async () => { if (local.pendingAutoStartDuelNodeId) { const duelNode = nodesById[local.pendingAutoStartDuelNodeId]; if (duelNode) { local.setDuelFocusNodeId(duelNode.id); sceneSfx.playDuelStart(); await wait(520); router.push(duelNode.href); } local.setPendingAutoStartDuelNodeId(null); return; } if (!local.pendingPostWinRetreatNodeId) return; local.setRetreatingNodeId(local.pendingPostWinRetreatNodeId); local.setPendingPostWinRetreatNodeId(null); },
  });

  const exitToHub = (): void => { sceneSfx.playButtonClick(); router.push("/hub"); };
  const sidebarProps = buildStorySceneSidebarProps({ briefing, selectedNode, isBusy, movementError: local.movementError, interactionFeedback: local.interactionFeedback, smartActionLabel: smartAction.label, canRunSmartAction: smartAction.isEnabled && !isBusy, onExitToHub: exitToHub, onSmartAction: () => { sceneSfx.playButtonClick(); void handleSmartAction(); }, onDeselect: () => { sceneSfx.playButtonClick(); setSelectedNodeId(null); } });
  const mapProps = buildStorySceneMapProps({
    nodes: sceneNodes, currentNodeId, selectedNodeId, avatarVisualTarget: entryAvatarVisualTarget ?? local.avatarVisualTarget, duelFocusNodeId: local.duelFocusNodeId, floatingReward: local.floatingReward, collectingRewardNodeId: local.collectingRewardNodeId, collectingRewardVisual: local.collectingRewardVisual, retreatingNodeId: local.retreatingNodeId, isBusy, smartActionLabel: smartAction.label, canRunSmartAction: smartAction.isEnabled && !isBusy, canMoveSelectedNode, actTransitionTargetId: local.actTransitionTargetId, shouldPlayActEntryAnimation, centerRequestKey: local.centerRequestKey, isSoundtrackMuted: isMapSoundtrackMuted,
    onSelectNode: (nodeId) => { if (nodeId) sceneSfx.playNodeSelect(); setSelectedNodeId(nodeId); },
    onMoveSelectedNode: () => { if (!canMoveSelectedNode || isBusy) return; sceneSfx.playButtonClick(); void handleSmartAction(); },
    onRequestCenterPlayer: () => { sceneSfx.playButtonClick(); local.setCenterRequestKey((value) => value + 1); },
    onExitToHub: exitToHub, onToggleSoundtrackMute: () => { sceneSfx.playButtonClick(); toggleMapSoundtrackMute(); }, onRewardCollectAnimationComplete: () => { local.setCollectingRewardNodeId(null); local.setCollectingRewardVisual(null); }, onRetreatAnimationComplete: () => local.setRetreatingNodeId(null),
    dialog: { isOpen: interactionDialog.isOpen, title: interactionDialog.dialogueTitle, cinematicVideo: interactionDialog.cinematicVideo, line: interactionDialog.currentLine, onNext: advanceInteractionDialog, onClose: finalizeInteractionDialog },
    submissionDialog: local.submissionDialog,
    setSubmissionDialog: local.setSubmissionDialog,
  });

  return isMobileLayout ? <StorySceneMobileLayout sidebar={sidebarProps} map={mapProps} /> : <StorySceneDesktopLayout sidebar={sidebarProps} map={mapProps} />;
}

