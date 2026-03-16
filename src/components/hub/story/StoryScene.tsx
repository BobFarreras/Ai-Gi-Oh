// src/components/hub/story/StoryScene.tsx - Escena principal Story con mapa vivo y panel lateral conectado a estado persistible.
"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "zustand";
import { StorySceneMapPane } from "./internal/scene/view/StorySceneMapPane";
import { StorySceneSidebarPane } from "./internal/scene/view/StorySceneSidebarPane";
import { createStorySceneActions } from "./internal/scene/actions/create-story-scene-actions";
import { createStorySceneStore, StorySceneStore } from "./internal/scene/state/story-scene-store";
import { resolveStorySceneCanMove } from "./internal/scene/state/resolve-story-scene-can-move";
import { useStoryNodeInteractionDialog } from "./internal/scene/dialog/use-story-node-interaction-dialog";
import { useStorySceneSfx } from "./internal/scene/audio/use-story-scene-sfx";
import { useStoryPostDuelTransition } from "./internal/scene/transitions/use-story-post-duel-transition";
import { IStoryMapRuntimeData } from "@/services/story/story-map-runtime-data";
import { IStoryChapterBriefing } from "@/services/story/build-story-chapter-briefing";
import { IStoryPostDuelTransition } from "@/services/story/duel-flow/story-post-duel-transition";
import { resolveStoryPrimaryAction } from "@/services/story/resolve-story-primary-action";
import { resolveStorySmartAction } from "@/services/story/resolve-story-smart-action";
interface IStorySceneProps { runtime: IStoryMapRuntimeData; briefing: IStoryChapterBriefing; postDuelTransition?: IStoryPostDuelTransition | null; }
interface IStoryCollectVisual { assetSrc: string; assetAlt: string; tone: "NEXUS" | "CARD"; }
function resolveNextActId(activeActId: number, availableActIds: number[]): number | null {
  const sorted = [...availableActIds].sort((left, right) => left - right); const currentIndex = sorted.indexOf(activeActId);
  if (currentIndex < 0 || sorted.length <= 1) return null; return sorted[(currentIndex + 1) % sorted.length] ?? null;
}

export function StoryScene({ runtime, briefing, postDuelTransition = null }: IStorySceneProps) {
  const router = useRouter();
  const [store] = useState<StorySceneStore>(() => createStorySceneStore({ nodes: runtime.nodes, currentNodeId: runtime.currentNodeId }));
  const selectedNodeId = useStore(store, (state) => state.selectedNodeId);
  const currentNodeId = useStore(store, (state) => state.currentNodeId);
  const nodesById = useStore(store, (state) => state.nodesById);
  const setSelectedNodeId = useStore(store, (state) => state.setSelectedNodeId);
  const setCurrentNodeId = useStore(store, (state) => state.setCurrentNodeId);
  const markNodeCompleted = useStore(store, (state) => state.markNodeCompleted);
  const [isMoving, setIsMoving] = useState(false);
  const [isInteracting, setIsInteracting] = useState(false);
  const [avatarVisualTarget, setAvatarVisualTarget] = useState<{ nodeId: string; stance: "CENTER" | "SIDE" } | null>(null);
  const [duelFocusNodeId, setDuelFocusNodeId] = useState<string | null>(null);
  const [floatingReward, setFloatingReward] = useState<{ label: string; tone: "NEXUS" | "CARD" } | null>(null);
  const [collectingRewardNodeId, setCollectingRewardNodeId] = useState<string | null>(null);
  const [collectingRewardVisual, setCollectingRewardVisual] = useState<IStoryCollectVisual | null>(null);
  const [retreatingNodeId, setRetreatingNodeId] = useState<string | null>(null);
  const [actTransitionTargetId, setActTransitionTargetId] = useState<number | null>(null);
  const [pendingCenterNodeId, setPendingCenterNodeId] = useState<string | null>(null);
  const [movementError, setMovementError] = useState<string | null>(null);
  const [interactionFeedback, setInteractionFeedback] = useState<string | null>(null);
  const interactionDialog = useStoryNodeInteractionDialog();
  const sceneSfx = useStorySceneSfx();
  const selectedNode = selectedNodeId ? nodesById[selectedNodeId] ?? null : null;
  const sceneNodes = useMemo(() => Object.values(nodesById).sort((left, right) => (left.chapter !== right.chapter ? left.chapter - right.chapter : left.duelIndex - right.duelIndex)), [nodesById]);
  const nextActId = resolveNextActId(runtime.activeActId, runtime.availableActIds);
  const actSwitchLabel = nextActId ? `Acto ${nextActId}` : null;
  const primaryAction = resolveStoryPrimaryAction(selectedNode);
  const canMoveSelectedNode = resolveStorySceneCanMove({
    selectedNode,
    currentNodeId,
    isInteracting,
    isDialogOpen: interactionDialog.isOpen,
  });
  const smartAction = resolveStorySmartAction({ selectedNode, canMove: canMoveSelectedNode, primaryAction });
  const isBusy = isMoving || isInteracting || interactionDialog.isOpen || Boolean(actTransitionTargetId);
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
  useEffect(() => { if (!actTransitionTargetId) return; const timeoutId = window.setTimeout(() => router.push(`/hub/story?act=${actTransitionTargetId}`), 900); return () => window.clearTimeout(timeoutId); }, [actTransitionTargetId, router]);
  const finalizeInteractionDialog = async () => {
    interactionDialog.close();
    if (!pendingCenterNodeId) return;
    sceneSfx.playEventFinish();
    setSelectedNodeId(pendingCenterNodeId);
    await centerAvatarOnNode(pendingCenterNodeId);
    setPendingCenterNodeId(null);
    setAvatarVisualTarget(null);
  };
  const advanceInteractionDialog = async () => {
    const shouldFinalize = interactionDialog.isLastLine;
    interactionDialog.next();
    if (shouldFinalize) await finalizeInteractionDialog();
  };
  return (
    <div className="flex h-full w-full flex-1 overflow-hidden border-t border-cyan-900/50 bg-black font-sans">
      <StorySceneSidebarPane
        briefing={briefing}
        selectedNode={selectedNode}
        isBusy={isBusy}
        movementError={movementError}
        interactionFeedback={interactionFeedback}
        smartActionLabel={smartAction.label}
        canRunSmartAction={smartAction.isEnabled && !isBusy}
        onSmartAction={() => { sceneSfx.playButtonClick(); void handleSmartAction(); }}
        onDeselect={() => { sceneSfx.playButtonClick(); setSelectedNodeId(null); }}
      />
      <StorySceneMapPane
        nodes={sceneNodes}
        currentNodeId={currentNodeId}
        selectedNodeId={selectedNodeId}
        avatarVisualTarget={avatarVisualTarget}
        duelFocusNodeId={duelFocusNodeId}
        floatingReward={floatingReward}
        collectingRewardNodeId={collectingRewardNodeId}
        collectingRewardVisual={collectingRewardVisual}
        retreatingNodeId={retreatingNodeId}
        isBusy={isBusy}
        actSwitchLabel={actSwitchLabel}
        actTransitionTargetId={actTransitionTargetId}
        onSelectNode={(nodeId) => {
          if (nodeId) sceneSfx.playNodeSelect();
          setSelectedNodeId(nodeId);
        }}
        onSwitchAct={() => { if (!nextActId) return; sceneSfx.playButtonClick(); router.push(`/hub/story?act=${nextActId}`); }}
        onRewardCollectAnimationComplete={() => { setCollectingRewardNodeId(null); setCollectingRewardVisual(null); }}
        onRetreatAnimationComplete={() => setRetreatingNodeId(null)}
        dialog={{
          isOpen: interactionDialog.isOpen,
          title: interactionDialog.dialogueTitle,
          soundtrackUrl: interactionDialog.soundtrackUrl,
          line: interactionDialog.currentLine,
          onNext: advanceInteractionDialog,
          onClose: finalizeInteractionDialog,
        }}
      />
    </div>
  );
}
