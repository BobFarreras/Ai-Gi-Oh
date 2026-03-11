// src/services/story/map-definitions/act-1-map-definition.ts - Definición visual editable del acto 1 del mapa Story.
import {
  IStoryActMapDefinition,
  IStoryMapVirtualNodeDefinition,
} from "@/services/story/map-definitions/story-map-definition-types";

function v(input: Omit<IStoryMapVirtualNodeDefinition, "chapter" | "difficulty" | "isBossDuel" | "rewardNexus" | "rewardPlayerExperience" | "opponentName" | "href"> & Partial<Pick<IStoryMapVirtualNodeDefinition, "chapter" | "difficulty" | "isBossDuel" | "rewardNexus" | "rewardPlayerExperience" | "opponentName" | "href">>): IStoryMapVirtualNodeDefinition {
  return {
    chapter: 1,
    difficulty: "ROOKIE",
    isBossDuel: false,
    rewardNexus: 0,
    rewardPlayerExperience: 0,
    opponentName: "Sistema",
    href: "#",
    ...input,
  };
}

/**
 * Acto 1 en formato árbol con rutas opcionales y solo una reconexión al camino principal.
 */
export const storyAct1MapDefinition: IStoryActMapDefinition = {
  act: 1,
  nodes: [
    { id: "story-ch1-duel-1", unlockRequirementNodeId: "story-ch1-path-blank-1", position: { x: 780, y: 980 } },
    { id: "story-ch1-duel-2", unlockRequirementNodeId: "story-ch1-reward-nexus-beta", position: { x: 3200, y: 980 } },
    { id: "story-ch1-duel-3", unlockRequirementNodeId: "story-ch1-duel-2", position: { x: 3500, y: 980 } },
  ],
  virtualNodes: [
    v({ id: "story-ch1-player-start", duelIndex: 90, nodeType: "MOVE", title: "Plataforma Inicial", unlockRequirementNodeId: null, position: { x: 260, y: 980 } }),
    v({ id: "story-ch1-path-blank-1", duelIndex: 91, nodeType: "MOVE", title: "Paso", unlockRequirementNodeId: "story-ch1-player-start", position: { x: 520, y: 980 } }),
    v({ id: "story-ch1-reward-nexus-beta", duelIndex: 109, nodeType: "REWARD_NEXUS", title: "Moneda", rewardNexus: 150, unlockRequirementNodeId: "story-ch1-duel-1", position: { x: 1040, y: 980 } }),
    v({ id: "story-ch1-hub-rejoin-alpha", duelIndex: 105, nodeType: "MOVE", title: "Checkpoint", unlockRequirementNodeId: "story-ch1-reward-nexus-beta", position: { x: 1300, y: 980 } }),
  ],
  platforms: [
    { id: "act1-p-1", position: { x: 260, y: 980 }, size: 170, style: "METAL" },
    { id: "act1-p-2", position: { x: 520, y: 980 }, size: 170, style: "METAL" },
    { id: "act1-p-3", position: { x: 780, y: 980 }, size: 170, style: "NEON" },
    { id: "act1-p-4", position: { x: 1040, y: 980 }, size: 170, style: "RUIN" },
    { id: "act1-p-5", position: { x: 1300, y: 980 }, size: 170, style: "METAL" },
    { id: "act1-p-6", position: { x: 3200, y: 980 }, size: 170, style: "NEON" },
    { id: "act1-p-7", position: { x: 3500, y: 980 }, size: 170, style: "RUIN" },
  ],
};
