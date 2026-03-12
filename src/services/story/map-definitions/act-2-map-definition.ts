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
 * Acto 2 con ramas profundas, un único punto de reconvergencia y subrutas opcionales sin retorno.
 */
export const storyAct2MapDefinition: IStoryActMapDefinition = {
  act: 2,
  nodes: [
    { id: "story-ch2-duel-1", unlockRequirementNodeId: "story-ch1-reward-nexus-beta", position: { x: 2860, y: 980 } },
    { id: "story-ch2-duel-2", unlockRequirementNodeId: "story-ch2-event-signal", position: { x: 3380, y: 980 } },
  ],
  virtualNodes: [
    v({ id: "story-ch2-event-signal", duelIndex: 201, nodeType: "EVENT", title: "Señal Fantasma", unlockRequirementNodeId: "story-ch2-duel-1", position: { x: 3120, y: 980 } }),
  ],
  platforms: [
    { id: "act2-p-1", position: { x: 2860, y: 980 }, size: 170, style: "RUIN" },
    { id: "act2-p-2", position: { x: 3120, y: 980 }, size: 170, style: "NEON" },
    { id: "act2-p-3", position: { x: 3380, y: 980 }, size: 170, style: "RUIN" },
  ],
};
