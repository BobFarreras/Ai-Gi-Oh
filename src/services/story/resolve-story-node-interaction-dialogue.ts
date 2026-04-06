// src/services/story/resolve-story-node-interaction-dialogue.ts - Resuelve secuencias narrativas por nodo Story para interacciones no-duelo.
import { IStoryMapNodeRuntime } from "@/services/story/story-map-runtime-data";
import { resolveStoryDialogueLineMedia } from "@/services/story/story-node-dialogue-media";
import { STORY_NODE_INTERACTION_DIALOGUE_BY_NODE_ID } from "@/services/story/story-node-interaction-dialogue-catalog";
import {
  IStoryInteractionDialogueLine,
  IStoryNodeInteractionDialogue,
} from "@/services/story/story-node-interaction-dialogue-types";

export type {
  IStoryInteractionDialogueLine,
  IStoryNodeInteractionDialogue,
} from "@/services/story/story-node-interaction-dialogue-types";

function buildFallbackDialogue(node: IStoryMapNodeRuntime): IStoryNodeInteractionDialogue {
  if (node.nodeType === "EVENT") {
    return {
      title: node.title,
      lines: [{ side: "RIGHT", visualKind: "CHARACTER", speaker: "Evento", text: "Se ejecuta una interacción narrativa sin combate." }],
      soundtrackUrl: "/audio/story/soundtracks/act-1/act-1-main-theme.mp3",
    };
  }
  if (node.nodeType === "REWARD_CARD" || node.nodeType === "REWARD_NEXUS") {
    return {
      title: node.title,
      lines: [{ side: "RIGHT", visualKind: "OBJECT", speaker: "Sistema", text: "Recompensa registrada en la ruta de historia." }],
    };
  }
  return {
    title: node.title,
    lines: [{ side: "RIGHT", visualKind: "OBJECT", speaker: "Sistema", text: "Nodo de exploración procesado." }],
  };
}

function withMultimedia(nodeId: string, dialogue: IStoryNodeInteractionDialogue): IStoryNodeInteractionDialogue {
  const lines: IStoryInteractionDialogueLine[] = dialogue.lines.map((line, index) => ({
    ...line,
    ...resolveStoryDialogueLineMedia(nodeId, index),
  }));
  return { ...dialogue, lines };
}

function buildRecurringSummary(firstDialogue: IStoryNodeInteractionDialogue, interactionCount: number): IStoryNodeInteractionDialogue {
  return {
    title: firstDialogue.title,
    soundtrackUrl: firstDialogue.soundtrackUrl,
    cinematicVideo: firstDialogue.cinematicVideo,
    lines: [
      {
        side: "RIGHT",
        visualKind: "OBJECT",
        speaker: "Sistema",
        text: `Registro recurrente detectado (${interactionCount}). Optimizando resumen narrativo.`,
      },
      ...firstDialogue.lines.slice(0, 1),
    ],
  };
}

/**
 * Devuelve la secuencia narrativa para nodos virtuales. Nodos de duelo no generan diálogo local.
 */
export function resolveStoryNodeInteractionDialogue(
  node: IStoryMapNodeRuntime,
  interactionCount = 1,
): IStoryNodeInteractionDialogue | null {
  if (!node.isVirtualNode && node.nodeType !== "EVENT" && node.nodeType !== "REWARD_CARD" && node.nodeType !== "REWARD_NEXUS") {
    return null;
  }
  const baseDialogue = STORY_NODE_INTERACTION_DIALOGUE_BY_NODE_ID[node.id] ?? buildFallbackDialogue(node);
  const firstDialogue = withMultimedia(node.id, baseDialogue);
  if (interactionCount <= 1) return firstDialogue;
  return buildRecurringSummary(firstDialogue, interactionCount);
}
