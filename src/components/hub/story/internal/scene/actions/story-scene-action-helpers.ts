// src/components/hub/story/internal/scene/actions/story-scene-action-helpers.ts - Utilidades comunes de acciones Story para errores API, espera y visuales de recompensa.
import { IStoryMapNodeRuntime } from "@/services/story/story-map-runtime-data";
import { resolveStoryRewardCardVisual } from "@/services/story/resolve-story-reward-card-visual";
import { resolveStoryEventNodeVisual } from "@/services/story/resolve-story-event-node-visual";
import { IStoryApiErrorResponse, IStoryCollectVisual } from "./story-scene-action-types";

export function resolveCollectVisual(targetNode: IStoryMapNodeRuntime): IStoryCollectVisual {
  if (targetNode.nodeType === "EVENT") {
    const eventVisual = resolveStoryEventNodeVisual(targetNode.id);
    return { assetSrc: eventVisual.assetSrc, assetAlt: eventVisual.assetAlt, tone: "CARD" };
  }
  if (targetNode.nodeType !== "REWARD_CARD") {
    return { assetSrc: "/assets/renders/nexus.webp", assetAlt: "Nexus obtenido", tone: "NEXUS" };
  }
  const cardVisual = resolveStoryRewardCardVisual(targetNode.rewardCardId);
  return { assetSrc: cardVisual.src, assetAlt: cardVisual.alt, tone: "CARD" };
}

export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export async function readApiErrorMessage(response: Response, fallbackMessage: string): Promise<string> {
  try {
    const payload = (await response.json()) as IStoryApiErrorResponse;
    if (typeof payload.message === "string" && payload.message.trim().length > 0) {
      return payload.message;
    }
    return fallbackMessage;
  } catch {
    return fallbackMessage;
  }
}

