// src/components/hub/story/StoryScene.tsx - Escena principal Story con mapa vivo y panel lateral conectado a estado persistible.
"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "zustand";
import { StoryCircuitMap } from "./StoryCircuitMap";
import { StoryNodeInteractionDialog } from "./internal/scene/dialog/StoryNodeInteractionDialog";
import { StorySidebar } from "./internal/scene/panels/StorySidebar";
import { createStorySceneStore, StorySceneStore } from "./internal/scene/state/story-scene-store";
import { resolveStorySceneCanMove } from "./internal/scene/state/resolve-story-scene-can-move";
import { useStoryNodeInteractionDialog } from "./internal/scene/dialog/use-story-node-interaction-dialog";
import { useStorySceneSfx } from "./internal/scene/audio/use-story-scene-sfx";
import { useStoryPostDuelTransition } from "./internal/scene/transitions/use-story-post-duel-transition";
import { IStoryMapRuntimeData } from "@/services/story/story-map-runtime-data";
import { IStoryChapterBriefing } from "@/services/story/build-story-chapter-briefing";
import { IStoryPostDuelTransition } from "@/services/story/duel-flow/story-post-duel-transition";
import { resolveStoryPrimaryAction } from "@/services/story/resolve-story-primary-action";
interface IStorySceneProps { runtime: IStoryMapRuntimeData; briefing: IStoryChapterBriefing; postDuelTransition?: IStoryPostDuelTransition | null; }
interface IStoryInteractResponse { interactionCountForNode: number; }
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
  const [retreatingNodeId, setRetreatingNodeId] = useState<string | null>(null);
  const [pendingCenterNodeId, setPendingCenterNodeId] = useState<string | null>(null);
  const [movementError, setMovementError] = useState<string | null>(null);
  const [interactionFeedback, setInteractionFeedback] = useState<string | null>(null);
  const interactionDialog = useStoryNodeInteractionDialog();
  const sceneSfx = useStorySceneSfx();
  const selectedNode = selectedNodeId ? nodesById[selectedNodeId] ?? null : null;
  const sceneNodes = useMemo(() => Object.values(nodesById).sort((left, right) => (left.chapter !== right.chapter ? left.chapter - right.chapter : left.duelIndex - right.duelIndex)), [nodesById]);
  const primaryAction = resolveStoryPrimaryAction(selectedNode);
  const canMoveSelectedNode = resolveStorySceneCanMove({
    selectedNode,
    currentNodeId,
    isInteracting,
    isDialogOpen: interactionDialog.isOpen,
  });
  const isBusy = isMoving || isInteracting || interactionDialog.isOpen;
  useStoryPostDuelTransition({
    transition: postDuelTransition,
    currentNodeId,
    setAvatarVisualTarget,
    setRetreatingNodeId,
  });
  const runRewardCollectAnimation = (nodeId: string): Promise<void> => new Promise((resolve) => { setCollectingRewardNodeId(nodeId); window.setTimeout(resolve, 620); });
  const showFloatingReward = (label: string, tone: "NEXUS" | "CARD"): void => {
    setFloatingReward({ label, tone });
    window.setTimeout(() => setFloatingReward(null), 620);
  };
  const centerAvatarOnNode = async (nodeId: string) => {
    setCurrentNodeId(nodeId); setAvatarVisualTarget({ nodeId, stance: "CENTER" }); await new Promise((resolve) => setTimeout(resolve, 260));
  };
  const handleMove = async (triggerActionAfterMove = false) => {
    if (!selectedNodeId || isMoving) return;
    setIsMoving(true); setMovementError(null); setInteractionFeedback(null);
    try {
      const response = await fetch("/api/story/world/move", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ nodeId: selectedNodeId }) });
      if (!response.ok) throw new Error("Movimiento inválido.");
      const payload = (await response.json()) as { currentNodeId: string | null };
      if (payload.currentNodeId) {
        sceneSfx.playMove();
        const targetNode = nodesById[payload.currentNodeId] ?? null;
        const shouldStaySide = Boolean(targetNode) && targetNode.nodeType !== "MOVE" && !targetNode.isCompleted;
        setCurrentNodeId(payload.currentNodeId);
        setAvatarVisualTarget({ nodeId: payload.currentNodeId, stance: shouldStaySide ? "SIDE" : "CENTER" });
        await new Promise((resolve) => setTimeout(resolve, shouldStaySide ? 360 : 420));
        if (!shouldStaySide) await centerAvatarOnNode(payload.currentNodeId);
      }
      await new Promise((resolve) => setTimeout(resolve, 420));
      if (triggerActionAfterMove && selectedNode && selectedNode.nodeType !== "MOVE") await handlePrimaryAction(selectedNode);
    } catch { setMovementError("No se pudo mover al nodo seleccionado."); } finally { setIsMoving(false); }
  };
  const handlePrimaryAction = async (targetNode = selectedNode) => {
    if (!targetNode) return;
    setInteractionFeedback(null);
    const targetMode = resolveStoryPrimaryAction(targetNode);
    if (targetMode.mode === "DISABLED") return;
    setAvatarVisualTarget({ nodeId: targetNode.id, stance: "SIDE" }); await new Promise((resolve) => setTimeout(resolve, 420));
    if (targetMode.mode === "ROUTE") {
      setDuelFocusNodeId(targetNode.id);
      sceneSfx.playDuelStart();
      await new Promise((resolve) => setTimeout(resolve, 520));
      router.push(targetNode.href);
      return;
    }
    if (targetMode.mode !== "VIRTUAL_INTERACTION") return;
    try {
      setIsInteracting(true);
      const response = await fetch("/api/story/world/interact", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ nodeId: targetNode.id }) });
      if (!response.ok) throw new Error("Interacción inválida.");
      const payload = (await response.json()) as IStoryInteractResponse;
      if (targetNode.nodeType === "REWARD_NEXUS") {
        sceneSfx.playRewardNexus();
        showFloatingReward(`+${targetNode.rewardNexus} NEXUS`, "NEXUS");
        await runRewardCollectAnimation(targetNode.id);
      }
      if (targetNode.nodeType === "REWARD_CARD") {
        sceneSfx.playRewardCard();
        showFloatingReward("+WINDOWS92", "CARD");
        await runRewardCollectAnimation(targetNode.id);
      }
      markNodeCompleted(targetNode.id);
      if (targetNode.nodeType === "REWARD_NEXUS" || targetNode.nodeType === "REWARD_CARD") {
        await centerAvatarOnNode(targetNode.id);
        setInteractionFeedback(targetNode.nodeType === "REWARD_NEXUS" ? `NEXUS obtenido: +${targetNode.rewardNexus}.` : "Carta obtenida: Windows92.");
        return;
      }
      const opened = interactionDialog.start(targetNode, payload.interactionCountForNode);
      setPendingCenterNodeId(targetNode.id);
      setInteractionFeedback(opened ? `Interacción iniciada: ${targetNode.title}.` : `Interacción completada: ${targetNode.title}.`);
    } catch { setInteractionFeedback("No se pudo registrar la interacción narrativa."); } finally { setIsInteracting(false); }
  };
  return (
    <div className="flex h-full w-full flex-1 overflow-hidden border-t border-cyan-900/50 bg-black font-sans">
      <div className="z-20 w-80 flex-shrink-0 border-r border-cyan-500/30 shadow-[10px_0_30px_rgba(0,0,0,0.8)] md:w-96">
        <StorySidebar
          briefing={briefing}
          selectedNode={selectedNode}
          canMove={canMoveSelectedNode}
          isMoving={isBusy}
          movementError={movementError}
          interactionFeedback={interactionFeedback}
          primaryActionLabel={primaryAction.label}
          canRunPrimaryAction={primaryAction.isEnabled && !isBusy && selectedNode?.id === currentNodeId}
          onMove={() => { sceneSfx.playButtonClick(); void handleMove(false); }}
          onPrimaryAction={() => { sceneSfx.playButtonClick(); void handlePrimaryAction(); }}
          onDeselect={() => { sceneSfx.playButtonClick(); setSelectedNodeId(null); }}
        />
      </div>
      <div className="relative z-0 flex-1 overflow-hidden bg-[#050810]">
        <StoryCircuitMap nodes={sceneNodes} currentNodeId={currentNodeId} selectedNodeId={selectedNodeId} avatarVisualTarget={avatarVisualTarget} duelFocusNodeId={duelFocusNodeId} floatingReward={floatingReward} collectingRewardNodeId={collectingRewardNodeId} retreatingNodeId={retreatingNodeId} isInteractionLocked={isBusy} onSelectNode={(nodeId) => { if (nodeId) sceneSfx.playNodeSelect(); setSelectedNodeId(nodeId); }} onRewardCollectAnimationComplete={() => setCollectingRewardNodeId(null)} />
        <StoryNodeInteractionDialog isOpen={interactionDialog.isOpen} title={interactionDialog.dialogueTitle} line={interactionDialog.currentLine} onNext={interactionDialog.next} onClose={async () => { interactionDialog.close(); if (pendingCenterNodeId) { await centerAvatarOnNode(pendingCenterNodeId); setPendingCenterNodeId(null); setAvatarVisualTarget(null); } }} />
      </div>
    </div>
  );
}
