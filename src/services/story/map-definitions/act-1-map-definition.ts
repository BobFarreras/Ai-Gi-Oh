// src/services/story/map-definitions/act-1-map-definition.ts - Definición visual del Acto 1 con ruta principal, bifurcación secundaria y cierre contra Soldado Acto 01.
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
 * Acto 1 actualizado:
 * briefing BigLog -> ruta principal -> duelos escalados -> boss Soldado -> transición a Acto 2.
 */
export const storyAct1MapDefinition: IStoryActMapDefinition = {
  act: 1,
  nodes: [
    { id: "story-ch1-duel-1", unlockRequirementNodeId: "story-a1-event-special-card-signal", position: { x: 1560, y: 980 } },
    { id: "story-ch1-duel-2", unlockRequirementNodeId: "story-a1-side-move-scraper-path", position: { x: 1300, y: 700 } },
    { id: "story-ch1-duel-3", unlockRequirementNodeId: "story-a1-move-main-bridge", position: { x: 2340, y: 980 } },
    { id: "story-ch2-duel-3", unlockRequirementNodeId: "story-ch1-duel-3", position: { x: 2600, y: 980 } },
    { id: "story-ch2-duel-4", unlockRequirementNodeId: "story-ch2-duel-3", position: { x: 2860, y: 980 } },
  ],
  virtualNodes: [
    v({ id: "story-ch1-player-start", duelIndex: 90, nodeType: "MOVE", title: "SafeHub", unlockRequirementNodeId: null, position: { x: 260, y: 980 } }),
    v({ id: "story-a1-event-biglog-briefing", duelIndex: 91, nodeType: "EVENT", title: "Briefing BigLog", unlockRequirementNodeId: "story-ch1-player-start", position: { x: 520, y: 980 } }),
    v({ id: "story-a1-move-transit", duelIndex: 92, nodeType: "MOVE", title: "Tránsito", unlockRequirementNodeId: "story-a1-event-biglog-briefing", position: { x: 780, y: 980 } }),

    v({ id: "story-a1-reward-nexus-cache", duelIndex: 93, nodeType: "REWARD_NEXUS", title: "Cache Nexus", rewardNexus: 180, unlockRequirementNodeId: "story-a1-move-transit", position: { x: 1040, y: 980 } }),
    v({ id: "story-a1-event-special-card-signal", duelIndex: 94, nodeType: "EVENT", title: "Señal Especial", unlockRequirementNodeId: "story-a1-reward-nexus-cache", position: { x: 1300, y: 980 } }),
    v({ id: "story-a1-reward-card-guardian", duelIndex: 95, nodeType: "REWARD_CARD", title: "Carta Guardián", rewardCardId: "trap-atk-drain", unlockRequirementNodeId: "story-ch1-duel-1", position: { x: 1820, y: 980 } }),
    v({ id: "story-a1-move-main-bridge", duelIndex: 96, nodeType: "MOVE", title: "Puente Principal", unlockRequirementNodeId: "story-a1-reward-card-guardian", position: { x: 2080, y: 980 } }),

    v({ id: "story-a1-side-event-echo-fragment", duelIndex: 97, nodeType: "EVENT", title: "Eco Fragmentado", unlockRequirementNodeId: "story-a1-move-transit", position: { x: 780, y: 700 } }),
    v({ id: "story-a1-side-move-scraper-path", duelIndex: 98, nodeType: "MOVE", title: "Ruta Scraper", unlockRequirementNodeId: "story-a1-side-event-echo-fragment", position: { x: 1040, y: 700 } }),
    v({ id: "story-a1-side-reward-card", duelIndex: 99, nodeType: "REWARD_CARD", title: "Recompensa Lateral", rewardCardId: "trap-kernel-panic", unlockRequirementNodeId: "story-ch1-duel-2", position: { x: 1560, y: 700 } }),

    v({ id: "story-ch1-transition-to-act2", duelIndex: 100, nodeType: "EVENT", title: "Puerta de Acto", unlockRequirementNodeId: "story-ch2-duel-4", position: { x: 3120, y: 980 } }),
  ],
  platforms: [
    { id: "act1-p-1", position: { x: 260, y: 980 }, size: 170, style: "METAL" },
    { id: "act1-p-2", position: { x: 520, y: 980 }, size: 170, style: "RUIN" },
    { id: "act1-p-3", position: { x: 780, y: 980 }, size: 170, style: "NEON" },
    { id: "act1-p-4", position: { x: 1040, y: 980 }, size: 170, style: "METAL" },
    { id: "act1-p-5", position: { x: 1300, y: 980 }, size: 170, style: "RUIN" },
    { id: "act1-p-6", position: { x: 1560, y: 980 }, size: 170, style: "NEON" },
    { id: "act1-p-7", position: { x: 1820, y: 980 }, size: 170, style: "METAL" },
    { id: "act1-p-8", position: { x: 2080, y: 980 }, size: 170, style: "RUIN" },
    { id: "act1-p-9", position: { x: 2340, y: 980 }, size: 170, style: "NEON" },
    { id: "act1-p-10", position: { x: 2600, y: 980 }, size: 170, style: "METAL" },
    { id: "act1-p-11", position: { x: 2860, y: 980 }, size: 170, style: "RUIN" },
    { id: "act1-p-12", position: { x: 3120, y: 980 }, size: 170, style: "NEON" },
    { id: "act1-p-13", position: { x: 780, y: 700 }, size: 170, style: "RUIN" },
    { id: "act1-p-14", position: { x: 1040, y: 700 }, size: 170, style: "METAL" },
    { id: "act1-p-15", position: { x: 1300, y: 700 }, size: 170, style: "NEON" },
    { id: "act1-p-16", position: { x: 1560, y: 700 }, size: 170, style: "RUIN" },
  ],
};
