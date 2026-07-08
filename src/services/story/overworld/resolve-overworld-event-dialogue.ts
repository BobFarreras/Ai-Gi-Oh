// src/services/story/overworld/resolve-overworld-event-dialogue.ts - Diálogo/vídeo real de un nodo de evento del overworld, reutilizando el catálogo Story.
import { resolveStoryDialogueLineMedia } from "@/services/story/story-node-dialogue-media";
import { STORY_NODE_INTERACTION_DIALOGUE_BY_NODE_ID } from "@/services/story/story-node-interaction-dialogue-catalog";
import { IStoryNodeInteractionDialogue } from "@/services/story/story-node-interaction-dialogue-types";

/**
 * Devuelve la secuencia narrativa (vídeo + líneas con retratos) de un nodo de
 * evento reutilizando el catálogo Story existente, o `null` si no tiene diálogo.
 */
export function resolveOverworldEventDialogue(nodeId: string): IStoryNodeInteractionDialogue | null {
  const base = STORY_NODE_INTERACTION_DIALOGUE_BY_NODE_ID[nodeId];
  if (!base) return null;
  return {
    ...base,
    lines: base.lines.map((line, index) => ({
      ...line,
      ...resolveStoryDialogueLineMedia(nodeId, index),
    })),
  };
}
