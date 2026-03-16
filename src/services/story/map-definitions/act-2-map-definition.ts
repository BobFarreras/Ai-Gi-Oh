// src/services/story/map-definitions/act-2-map-definition.ts - Definición visual editable del acto 2 del mapa Story.
import {
  IStoryActMapDefinition,
  IStoryMapVirtualNodeDefinition,
} from "@/services/story/map-definitions/story-map-definition-types";

function v(input: Omit<IStoryMapVirtualNodeDefinition, "chapter" | "difficulty" | "isBossDuel" | "rewardNexus" | "rewardPlayerExperience" | "opponentName" | "href"> & Partial<Pick<IStoryMapVirtualNodeDefinition, "chapter" | "difficulty" | "isBossDuel" | "rewardNexus" | "rewardPlayerExperience" | "opponentName" | "href">>): IStoryMapVirtualNodeDefinition {
  return {
    chapter: 2,
    difficulty: "STANDARD",
    isBossDuel: false,
    rewardNexus: 0,
    rewardPlayerExperience: 0,
    opponentName: "Sistema",
    href: "#",
    ...input,
  };
}

/**
 * Acto 2 simplificado para transición al bloque BOSS.
 */
export const storyAct2MapDefinition: IStoryActMapDefinition = {
  act: 2,
  nodes: [
    { id: "story-ch2-duel-1", unlockRequirementNodeId: "story-ch2-path-coin-b", position: { x: 3640, y: 980 } },
    { id: "story-ch2-duel-2", unlockRequirementNodeId: "story-ch2-event-signal", position: { x: 4160, y: 980 } },
  ],
  virtualNodes: [
    v({ id: "story-ch2-path-coin-a", duelIndex: 201, nodeType: "REWARD_NEXUS", title: "Moneda", rewardNexus: 220, unlockRequirementNodeId: "story-ch2-path-entry", position: { x: 3120, y: 980 } }),
    v({ id: "story-ch2-path-coin-b", duelIndex: 202, nodeType: "REWARD_NEXUS", title: "Moneda", rewardNexus: 280, unlockRequirementNodeId: "story-ch2-path-coin-a", position: { x: 3380, y: 980 } }),
    v({ id: "story-ch2-event-signal", duelIndex: 203, nodeType: "EVENT", title: "Señal Fantasma", unlockRequirementNodeId: "story-ch2-duel-1", position: { x: 3900, y: 980 } }),
    v({ id: "story-ch2-path-entry", duelIndex: 204, nodeType: "MOVE", title: "Entrada", unlockRequirementNodeId: "story-ch2-duel-4", position: { x: 2860, y: 980 } }),
  ],
  platforms: [
    { id: "act2-p-1", position: { x: 2860, y: 980 }, size: 170, style: "RUIN" },
    { id: "act2-p-2", position: { x: 3120, y: 980 }, size: 170, style: "NEON" },
    { id: "act2-p-3", position: { x: 3380, y: 980 }, size: 170, style: "RUIN" },
    { id: "act2-p-4", position: { x: 3640, y: 980 }, size: 170, style: "METAL" },
    { id: "act2-p-5", position: { x: 3900, y: 980 }, size: 170, style: "RUIN" },
    { id: "act2-p-6", position: { x: 4160, y: 980 }, size: 170, style: "NEON" },
  ],
};
