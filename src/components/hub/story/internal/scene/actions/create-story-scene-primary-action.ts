// src/components/hub/story/internal/scene/actions/create-story-scene-primary-action.ts - Construye el handler de acción primaria Story (ruta, transición e interacción virtual).
import { resolveStoryPrimaryAction } from "@/services/story/resolve-story-primary-action";
import { resolveStoryActTransitionTarget } from "@/services/story/resolve-story-act-transition-target";
import { isStoryActTransitionAvailable, resolveStoryActTransitionUnavailableMessage } from "@/services/story/resolve-story-act-transition-availability";
import { resolveStoryNodeSubmissionPrompt } from "@/services/story/story-node-submission-rules";
import { resolveStoryAvatarSideDirection } from "@/components/hub/story/internal/scene/utils/resolve-story-avatar-side-direction";
import { IStoryMapNodeRuntime } from "@/services/story/story-map-runtime-data";
import { ICreateStorySceneActionsParams, IStoryInteractResponse, StoryRewardTone } from "./story-scene-action-types";
import { readApiErrorMessage, wait } from "./story-scene-action-helpers";

interface IStoryPrimaryActionFeedbackApi {
  showFloatingReward: (label: string, tone: StoryRewardTone) => void;
  runRewardCollectAnimation: (targetNode: IStoryMapNodeRuntime) => Promise<void>;
  centerAvatarOnNode: (nodeId: string) => Promise<void>;
  portalAvatarOnNode: (nodeId: string) => Promise<void>;
}

/**
 * Resuelve la acción principal según el tipo de nodo Story seleccionado.
 */
export function createStoryScenePrimaryAction(input: {
  params: ICreateStorySceneActionsParams;
  handleMove: (triggerActionAfterMove?: boolean, targetNodeForAction?: IStoryMapNodeRuntime | null) => Promise<void>;
  api: IStoryPrimaryActionFeedbackApi;
}) {
  return async (targetNode = input.params.selectedNode, skipRouteMoveCheck = false): Promise<void> => {
    if (!targetNode) return;
    input.params.setInteractionFeedback(null);
    const targetMode = resolveStoryPrimaryAction(targetNode);
    if (targetMode.mode === "DISABLED") return;
    if (targetMode.mode === "ROUTE" && targetNode.id !== input.params.currentNodeId && !skipRouteMoveCheck) {
      return input.handleMove(true, targetNode);
    }
    const currentNode = input.params.currentNodeId ? input.params.nodesById[input.params.currentNodeId] ?? null : null;
    const sideDirection = resolveStoryAvatarSideDirection(currentNode, targetNode);
    input.params.setAvatarVisualTarget(targetMode.mode === "VIRTUAL_INTERACTION" ? { nodeId: targetNode.id, stance: "CENTER" } : { nodeId: targetNode.id, stance: "SIDE", sideDirection });
    await wait(420);
    if (targetMode.mode === "ROUTE") {
      if ((targetNode.id === "story-ch2-duel-8" || targetNode.id === "story-ch2-duel-7") && !input.params.hasSeenPreDuelDialogue(targetNode.id)) {
        const opened = input.params.startInteractionDialog(targetNode, 1);
        input.params.markPreDuelDialogueSeen(targetNode.id);
        if (opened) {
          if (targetNode.id === "story-ch2-duel-7") input.params.scheduleAutoStartDuelAfterDialogue(targetNode.id);
          input.params.setInteractionFeedback(targetNode.id === "story-ch2-duel-8" ? "Briefing de evaluación de BigLog completado." : "Canal de amenaza de Helena registrado.");
          return;
        }
      }
      input.params.setDuelFocusNodeId(targetNode.id);
      input.params.sceneSfx.playDuelStart();
      await wait(520);
      input.params.navigateTo(targetNode.href);
      return;
    }
    if (targetMode.mode !== "VIRTUAL_INTERACTION") return;
    const actTransitionTarget = resolveStoryActTransitionTarget(targetNode.id);
    if (actTransitionTarget) {
      if (!isStoryActTransitionAvailable(targetNode.id)) {
        await input.api.portalAvatarOnNode(targetNode.id);
        const opened = input.params.startInteractionDialog(targetNode, 1);
        input.params.setPendingCenterNodeId(targetNode.id);
        input.params.setInteractionFeedback(opened ? "Transición temporalmente deshabilitada por reconstrucción de nodos." : (resolveStoryActTransitionUnavailableMessage(targetNode.id) ?? "Transición temporalmente no disponible."));
        return;
      }
      input.params.markNodeCompleted(targetNode.id);
      await input.api.portalAvatarOnNode(targetNode.id);
      input.params.requestActTransition(actTransitionTarget);
      input.params.setInteractionFeedback(`Transición iniciada hacia Acto ${actTransitionTarget}.`);
      return;
    }
    try {
      input.params.setIsInteracting(true);
      const submissionPrompt = resolveStoryNodeSubmissionPrompt(targetNode.id);
      let submissionAnswer: string | undefined;
      if (submissionPrompt) {
        const answer = await input.params.requestNodeSubmission(targetNode.id);
        if (!answer || !answer.trim()) {
          input.params.setInteractionFeedback("Submission cancelada. El puente sigue bloqueado.");
          return;
        }
        submissionAnswer = answer.trim();
      }
      const response = await fetch("/api/story/world/interact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ nodeId: targetNode.id, ...(submissionAnswer ? { submissionAnswer } : {}) }),
      });
      if (!response.ok) throw new Error(await readApiErrorMessage(response, "Interacción inválida."));
      const payload = (await response.json()) as IStoryInteractResponse;
      if (targetNode.nodeType === "REWARD_NEXUS") {
        input.params.sceneSfx.playRewardNexus();
        input.api.showFloatingReward(`+${targetNode.rewardNexus} NEXUS`, "NEXUS");
        await input.api.runRewardCollectAnimation(targetNode);
      }
      if (targetNode.nodeType === "REWARD_CARD") {
        input.params.sceneSfx.playRewardCard();
        input.api.showFloatingReward("+WINDOWS92", "CARD");
        await input.api.runRewardCollectAnimation(targetNode);
      }
      input.params.markNodeCompleted(targetNode.id);
      if (targetNode.nodeType === "EVENT" || targetNode.nodeType === "REWARD_CARD" || targetNode.nodeType === "REWARD_NEXUS") {
        await input.api.portalAvatarOnNode(targetNode.id);
      }
      if (targetNode.nodeType === "REWARD_NEXUS" || targetNode.nodeType === "REWARD_CARD") {
        await input.api.centerAvatarOnNode(targetNode.id);
        input.params.setInteractionFeedback(targetNode.nodeType === "REWARD_NEXUS" ? `NEXUS obtenido: +${targetNode.rewardNexus}.` : "Carta obtenida: Windows92.");
        return;
      }
      const opened = input.params.startInteractionDialog(targetNode, payload.interactionCountForNode);
      input.params.setPendingCenterNodeId(targetNode.id);
      input.params.setInteractionFeedback(opened ? `Interacción iniciada: ${targetNode.title}.` : `Interacción completada: ${targetNode.title}.`);
    } catch {
      input.params.setInteractionFeedback("No se pudo registrar la interacción narrativa.");
    } finally {
      input.params.setIsInteracting(false);
    }
  };
}
