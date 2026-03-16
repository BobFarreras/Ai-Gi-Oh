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
 * Acto 2 lineal expandido para cubrir la rotación completa de oponentes del bloque Story.
 */
export const storyAct2MapDefinition: IStoryActMapDefinition = {
  act: 2,
  nodes: [
    { id: "story-ch2-duel-1", unlockRequirementNodeId: "story-ch1-reward-nexus-beta", position: { x: 2860, y: 980 } },
    { id: "story-ch2-duel-2", unlockRequirementNodeId: "story-ch2-event-signal", position: { x: 3380, y: 980 } },
    { id: "story-ch2-duel-3", unlockRequirementNodeId: "story-ch2-reward-nexus-gamma", position: { x: 3900, y: 980 } },
    { id: "story-ch2-duel-4", unlockRequirementNodeId: "story-ch2-reward-card-ops", position: { x: 4420, y: 980 } },
    { id: "story-ch2-duel-5", unlockRequirementNodeId: "story-ch2-event-war-room", position: { x: 4940, y: 980 } },
    { id: "story-ch2-duel-6", unlockRequirementNodeId: "story-ch2-event-final-brief", position: { x: 5460, y: 980 } },
  ],
  virtualNodes: [
    v({ id: "story-ch2-event-signal", duelIndex: 201, nodeType: "EVENT", title: "Señal Fantasma", unlockRequirementNodeId: "story-ch2-duel-1", position: { x: 3120, y: 980 } }),
    v({ id: "story-ch2-reward-nexus-gamma", duelIndex: 202, nodeType: "REWARD_NEXUS", title: "Cache Nexus", rewardNexus: 250, unlockRequirementNodeId: "story-ch2-duel-2", position: { x: 3640, y: 980 } }),
    v({ id: "story-ch2-reward-card-ops", duelIndex: 203, nodeType: "REWARD_CARD", title: "Drop Táctico", rewardCardId: "trap-runtime-punish", unlockRequirementNodeId: "story-ch2-duel-3", position: { x: 4160, y: 980 } }),
    v({ id: "story-ch2-event-war-room", duelIndex: 204, nodeType: "EVENT", title: "War Room", unlockRequirementNodeId: "story-ch2-duel-4", position: { x: 4680, y: 980 } }),
    v({ id: "story-ch2-event-final-brief", duelIndex: 205, nodeType: "EVENT", title: "Briefing Final", unlockRequirementNodeId: "story-ch2-duel-5", position: { x: 5200, y: 980 } }),
  ],
  platforms: [
    { id: "act2-p-1", position: { x: 2860, y: 980 }, size: 170, style: "RUIN" },
    { id: "act2-p-2", position: { x: 3120, y: 980 }, size: 170, style: "NEON" },
    { id: "act2-p-3", position: { x: 3380, y: 980 }, size: 170, style: "RUIN" },
    { id: "act2-p-4", position: { x: 3640, y: 980 }, size: 170, style: "METAL" },
    { id: "act2-p-5", position: { x: 3900, y: 980 }, size: 170, style: "RUIN" },
    { id: "act2-p-6", position: { x: 4160, y: 980 }, size: 170, style: "NEON" },
    { id: "act2-p-7", position: { x: 4420, y: 980 }, size: 170, style: "RUIN" },
    { id: "act2-p-8", position: { x: 4680, y: 980 }, size: 170, style: "METAL" },
    { id: "act2-p-9", position: { x: 4940, y: 980 }, size: 170, style: "RUIN" },
    { id: "act2-p-10", position: { x: 5200, y: 980 }, size: 170, style: "NEON" },
    { id: "act2-p-11", position: { x: 5460, y: 980 }, size: 170, style: "NEON" },
  ],
};
