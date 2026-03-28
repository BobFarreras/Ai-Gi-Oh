// src/components/hub/story/internal/scene/actions/create-story-scene-actions.ts - Factoría de acciones Story para mover/interactuar sin inflar el componente de escena.
import { IStoryMapNodeRuntime } from "@/services/story/story-map-runtime-data";
import { resolveStoryPrimaryAction } from "@/services/story/resolve-story-primary-action";
import { resolveStoryRewardCardVisual } from "@/services/story/resolve-story-reward-card-visual";
import { animateStoryAvatarPath } from "@/components/hub/story/internal/scene/actions/animate-story-avatar-path";
import { resolveStoryActTransitionTarget } from "@/services/story/resolve-story-act-transition-target";

interface IStoryInteractResponse { interactionCountForNode: number; }
type StoryRewardTone = "NEXUS" | "CARD";
type StorySmartActionMode = "MOVE" | "PRIMARY" | "MOVE_AND_PRIMARY" | "DISABLED";
interface IStoryCollectVisual { assetSrc: string; assetAlt: string; tone: StoryRewardTone; }

interface ICreateStorySceneActionsParams {
  selectedNodeId: string | null;
  selectedNode: IStoryMapNodeRuntime | null;
  currentNodeId: string | null;
  nodesById: Record<string, IStoryMapNodeRuntime>;
  isMoving: boolean;
  smartActionMode: StorySmartActionMode;
  setIsMoving: (value: boolean) => void;
  setIsInteracting: (value: boolean) => void;
  setMovementError: (value: string | null) => void;
  setInteractionFeedback: (value: string | null) => void;
  setCurrentNodeId: (nodeId: string) => void;
  setAvatarVisualTarget: (value: { nodeId: string; stance: "CENTER" | "SIDE" | "PORTAL" } | null) => void;
  setDuelFocusNodeId: (value: string | null) => void;
  setFloatingReward: (value: { label: string; tone: StoryRewardTone } | null) => void;
  setCollectingRewardNodeId: (value: string | null) => void;
  setCollectingRewardVisual: (value: IStoryCollectVisual | null) => void;
  setPendingCenterNodeId: (value: string | null) => void;
  markNodeCompleted: (nodeId: string) => void;
  sceneSfx: { playMove: () => void; playDuelStart: () => void; playRewardNexus: () => void; playRewardCard: () => void; };
  navigateTo: (href: string) => void;
  requestActTransition: (actId: number) => void;
  startInteractionDialog: (node: IStoryMapNodeRuntime, interactionCountForNode: number) => boolean;
}

function resolveCollectVisual(targetNode: IStoryMapNodeRuntime): IStoryCollectVisual {
  if (targetNode.nodeType !== "REWARD_CARD") return { assetSrc: "/assets/renders/nexus.webp", assetAlt: "Nexus obtenido", tone: "NEXUS" };
  const cardVisual = resolveStoryRewardCardVisual(targetNode.rewardCardId);
  return { assetSrc: cardVisual.src, assetAlt: cardVisual.alt, tone: "CARD" };
}

function wait(ms: number): Promise<void> { return new Promise((resolve) => window.setTimeout(resolve, ms)); }
export function createStorySceneActions(params: ICreateStorySceneActionsParams) {
  const showFloatingReward = (label: string, tone: StoryRewardTone): void => {
    params.setFloatingReward({ label, tone });
    window.setTimeout(() => params.setFloatingReward(null), 620);
  };
  const runRewardCollectAnimation = async (targetNode: IStoryMapNodeRuntime): Promise<void> => { params.setCollectingRewardNodeId(targetNode.id); params.setCollectingRewardVisual(resolveCollectVisual(targetNode)); await wait(620); };
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
  const handleMove = async (triggerActionAfterMove = false, targetNodeForAction: IStoryMapNodeRuntime | null = params.selectedNode): Promise<void> => {
    if (!params.selectedNodeId || params.isMoving) return;
    params.setIsMoving(true);
    params.setMovementError(null);
    params.setInteractionFeedback(null);
    try {
      const response = await fetch("/api/story/world/move", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ nodeId: params.selectedNodeId }) });
      if (!response.ok) throw new Error("Movimiento inválido.");
      const payload = (await response.json()) as { currentNodeId: string | null; pathNodeIds?: string[] };
      const travelPathNodeIds = payload.pathNodeIds ?? (payload.currentNodeId ? [payload.currentNodeId] : []);
      if (travelPathNodeIds.length > 0) {
        params.sceneSfx.playMove();
        await animateStoryAvatarPath({
          pathNodeIds: travelPathNodeIds,
          nodesById: params.nodesById,
          setCurrentNodeId: params.setCurrentNodeId,
          setAvatarVisualTarget: params.setAvatarVisualTarget,
          wait,
        });
      }
      await wait(420);
      if (triggerActionAfterMove && targetNodeForAction && targetNodeForAction.nodeType !== "MOVE") {
        await handlePrimaryAction(targetNodeForAction, true);
      }
    } catch {
      params.setMovementError("No se pudo mover al nodo seleccionado.");
    } finally {
      params.setIsMoving(false);
    }
  };
  const handlePrimaryAction = async (targetNode = params.selectedNode, skipRouteMoveCheck = false): Promise<void> => {
    if (!targetNode) return;
    params.setInteractionFeedback(null);
    const targetMode = resolveStoryPrimaryAction(targetNode);
    if (targetMode.mode === "DISABLED") return;
    if (targetMode.mode === "ROUTE" && targetNode.id !== params.currentNodeId && !skipRouteMoveCheck) return handleMove(true, targetNode);
    params.setAvatarVisualTarget({ nodeId: targetNode.id, stance: targetMode.mode === "VIRTUAL_INTERACTION" ? "CENTER" : "SIDE" });
    await wait(420);
    if (targetMode.mode === "ROUTE") {
      params.setDuelFocusNodeId(targetNode.id);
      params.sceneSfx.playDuelStart();
      await wait(520);
      params.navigateTo(targetNode.href);
      return;
    }
    if (targetMode.mode !== "VIRTUAL_INTERACTION") return;
    try {
      params.setIsInteracting(true);
      const response = await fetch("/api/story/world/interact", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ nodeId: targetNode.id }) });
      if (!response.ok) throw new Error("Interacción inválida.");
      const payload = (await response.json()) as IStoryInteractResponse;
      if (targetNode.nodeType === "REWARD_NEXUS") {
        params.sceneSfx.playRewardNexus();
        showFloatingReward(`+${targetNode.rewardNexus} NEXUS`, "NEXUS");
        await runRewardCollectAnimation(targetNode);
      }
      if (targetNode.nodeType === "REWARD_CARD") {
        params.sceneSfx.playRewardCard();
        showFloatingReward("+WINDOWS92", "CARD");
        await runRewardCollectAnimation(targetNode);
      }
      params.markNodeCompleted(targetNode.id);
      const actTransitionTarget = resolveStoryActTransitionTarget(targetNode.id);
      if (actTransitionTarget) {
        await portalAvatarOnNode(targetNode.id);
        params.requestActTransition(actTransitionTarget);
        params.setInteractionFeedback(`Transición iniciada hacia Acto ${actTransitionTarget}.`);
        return;
      }
      if (targetNode.nodeType === "EVENT" || targetNode.nodeType === "REWARD_CARD" || targetNode.nodeType === "REWARD_NEXUS") {
        await portalAvatarOnNode(targetNode.id);
      }
      if (targetNode.nodeType === "REWARD_NEXUS" || targetNode.nodeType === "REWARD_CARD") {
        await centerAvatarOnNode(targetNode.id);
        params.setInteractionFeedback(targetNode.nodeType === "REWARD_NEXUS" ? `NEXUS obtenido: +${targetNode.rewardNexus}.` : "Carta obtenida: Windows92.");
        return;
      }
      const opened = params.startInteractionDialog(targetNode, payload.interactionCountForNode);
      params.setPendingCenterNodeId(targetNode.id);
      params.setInteractionFeedback(opened ? `Interacción iniciada: ${targetNode.title}.` : `Interacción completada: ${targetNode.title}.`);
    } catch {
      params.setInteractionFeedback("No se pudo registrar la interacción narrativa.");
    } finally {
      params.setIsInteracting(false);
    }
  };
  const handleSmartAction = async (): Promise<void> => { if (params.smartActionMode === "MOVE") return handleMove(false); if (params.smartActionMode === "PRIMARY") return handlePrimaryAction(); if (params.smartActionMode === "MOVE_AND_PRIMARY") return handleMove(true); };
  return { centerAvatarOnNode, handleMove, handlePrimaryAction, handleSmartAction };
}
