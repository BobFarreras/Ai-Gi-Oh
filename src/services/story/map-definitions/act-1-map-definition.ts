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
 * Acto 1 expandido para validar la nueva rotación de oponentes antes del bloque BOSS.
 */
export const storyAct1MapDefinition: IStoryActMapDefinition = {
  act: 1,
  nodes: [
    { id: "story-ch1-duel-1", unlockRequirementNodeId: "story-ch1-path-blank-1", position: { x: 780, y: 980 } },
    { id: "story-ch1-duel-2", unlockRequirementNodeId: "story-ch1-reward-nexus-alpha", position: { x: 1300, y: 980 } },
    { id: "story-ch1-duel-3", unlockRequirementNodeId: "story-ch1-reward-nexus-beta", position: { x: 1820, y: 980 } },
    { id: "story-ch2-duel-3", unlockRequirementNodeId: "story-ch1-event-scout-log", position: { x: 2340, y: 980 } },
    { id: "story-ch2-duel-4", unlockRequirementNodeId: "story-ch1-reward-card-windows92", position: { x: 2860, y: 980 } },
  ],
  virtualNodes: [
    v({ id: "story-ch1-player-start", duelIndex: 90, nodeType: "MOVE", title: "Plataforma Inicial", unlockRequirementNodeId: null, position: { x: 260, y: 980 } }),
    v({ id: "story-ch1-path-blank-1", duelIndex: 91, nodeType: "MOVE", title: "Paso", unlockRequirementNodeId: "story-ch1-player-start", position: { x: 520, y: 980 } }),
    v({ id: "story-ch1-reward-nexus-alpha", duelIndex: 109, nodeType: "REWARD_NEXUS", title: "Moneda", rewardNexus: 150, unlockRequirementNodeId: "story-ch1-duel-1", position: { x: 1040, y: 980 } }),
    v({ id: "story-ch1-reward-nexus-beta", duelIndex: 110, nodeType: "REWARD_NEXUS", title: "Moneda", rewardNexus: 200, unlockRequirementNodeId: "story-ch1-duel-2", position: { x: 1560, y: 980 } }),
    v({ id: "story-ch1-event-scout-log", duelIndex: 111, nodeType: "EVENT", title: "Evento", unlockRequirementNodeId: "story-ch1-duel-3", position: { x: 2080, y: 980 } }),
    v({ id: "story-ch1-reward-card-windows92", duelIndex: 112, nodeType: "REWARD_CARD", title: "Carta", rewardCardId: "trap-windows92-crash", unlockRequirementNodeId: "story-ch2-duel-3", position: { x: 2600, y: 980 } }),
  ],
  platforms: [
    { id: "act1-p-1", position: { x: 260, y: 980 }, size: 170, style: "METAL" },
    { id: "act1-p-2", position: { x: 520, y: 980 }, size: 170, style: "METAL" },
    { id: "act1-p-3", position: { x: 780, y: 980 }, size: 170, style: "NEON" },
    { id: "act1-p-4", position: { x: 1040, y: 980 }, size: 170, style: "RUIN" },
    { id: "act1-p-5", position: { x: 1300, y: 980 }, size: 170, style: "RUIN" },
    { id: "act1-p-6", position: { x: 1560, y: 980 }, size: 170, style: "METAL" },
    { id: "act1-p-7", position: { x: 1820, y: 980 }, size: 170, style: "NEON" },
    { id: "act1-p-8", position: { x: 2080, y: 980 }, size: 170, style: "RUIN" },
    { id: "act1-p-9", position: { x: 2340, y: 980 }, size: 170, style: "METAL" },
    { id: "act1-p-10", position: { x: 2600, y: 980 }, size: 170, style: "RUIN" },
    { id: "act1-p-11", position: { x: 2860, y: 980 }, size: 170, style: "NEON" },
  ],
};
