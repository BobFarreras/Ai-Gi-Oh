// src/core/services/story/world/resolve-story-node-interaction.ts - Resuelve la acción principal de interacción según el tipo de nodo Story.
import { IStoryWorldNode, StoryWorldNodeType } from "@/core/services/story/world/story-world-types";

export type StoryPrimaryActionKind =
  | "ENTER_DUEL"
  | "CLAIM_REWARD"
  | "TRIGGER_EVENT"
  | "MOVE_ONLY";

export interface IStoryNodeInteraction {
  actionKind: StoryPrimaryActionKind;
  actionLabel: string;
  requiresBattle: boolean;
}

function mapTypeToAction(type: StoryWorldNodeType): IStoryNodeInteraction {
  switch (type) {
    case "DUEL":
    case "BOSS":
      return { actionKind: "ENTER_DUEL", actionLabel: "Entrar al duelo", requiresBattle: true };
    case "REWARD_CARD":
      return { actionKind: "CLAIM_REWARD", actionLabel: "Coger carta", requiresBattle: false };
    case "REWARD_NEXUS":
      return { actionKind: "CLAIM_REWARD", actionLabel: "Coger NEXUS", requiresBattle: false };
    case "EVENT":
      return { actionKind: "TRIGGER_EVENT", actionLabel: "Activar evento", requiresBattle: false };
    case "MOVE":
      return { actionKind: "MOVE_ONLY", actionLabel: "Explorar nodo", requiresBattle: false };
  }
}

/**
 * Define qué acción principal debe ofrecer la UI para cada nodo Story.
 */
export function resolveStoryNodeInteraction(node: Pick<IStoryWorldNode, "nodeType">): IStoryNodeInteraction {
  return mapTypeToAction(node.nodeType);
}
