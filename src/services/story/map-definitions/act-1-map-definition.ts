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
 * Acto 1 real con bifurcaciones y cierre en BOSS para desbloquear entrada al acto 2.
 */
export const storyAct1MapDefinition: IStoryActMapDefinition = {
  act: 1,
  nodes: [
    { id: "story-ch1-duel-1", unlockRequirementNodeId: "story-ch1-path-upper-a", position: { x: 1560, y: 760 } },
    { id: "story-ch1-duel-2", unlockRequirementNodeId: "story-ch1-path-lower-b", position: { x: 1820, y: 1220 } },
    { id: "story-ch1-duel-3", unlockRequirementNodeId: "story-ch1-path-upper-branch-2", position: { x: 2860, y: 1000 } },
    { id: "story-ch2-duel-3", unlockRequirementNodeId: "story-ch1-path-lower-branch-nexus", position: { x: 3120, y: 1420 } },
    { id: "story-ch2-duel-4", unlockRequirementNodeId: "story-ch1-path-lower-final-blank", position: { x: 3640, y: 1420 } },
  ],
  virtualNodes: [
    v({ id: "story-ch1-player-start", duelIndex: 90, nodeType: "MOVE", title: "Plataforma Inicial", unlockRequirementNodeId: null, position: { x: 260, y: 980 } }),
    v({ id: "story-ch1-path-blank-1", duelIndex: 91, nodeType: "MOVE", title: "Paso", unlockRequirementNodeId: "story-ch1-player-start", position: { x: 520, y: 980 } }),
    v({ id: "story-ch1-reward-card-alpha", duelIndex: 92, nodeType: "REWARD_CARD", title: "Carta", rewardCardId: "trap-atk-drain", unlockRequirementNodeId: "story-ch1-path-blank-1", position: { x: 780, y: 980 } }),
    v({ id: "story-ch1-path-branch-1", duelIndex: 93, nodeType: "MOVE", title: "Bifurcación", unlockRequirementNodeId: "story-ch1-reward-card-alpha", position: { x: 1040, y: 980 } }),
    v({ id: "story-ch1-path-upper-a", duelIndex: 94, nodeType: "MOVE", title: "Ruta Superior", unlockRequirementNodeId: "story-ch1-path-branch-1", position: { x: 1300, y: 760 } }),
    v({ id: "story-ch1-reward-nexus-upper", duelIndex: 95, nodeType: "REWARD_NEXUS", title: "Moneda", rewardNexus: 160, unlockRequirementNodeId: "story-ch1-duel-1", position: { x: 1820, y: 760 } }),
    v({ id: "story-ch1-path-lower-a", duelIndex: 96, nodeType: "MOVE", title: "Ruta Inferior", unlockRequirementNodeId: "story-ch1-path-branch-1", position: { x: 1300, y: 1220 } }),
    v({ id: "story-ch1-path-lower-b", duelIndex: 97, nodeType: "MOVE", title: "Tramo Inferior", unlockRequirementNodeId: "story-ch1-path-lower-a", position: { x: 1560, y: 1220 } }),
    v({ id: "story-ch1-reward-nexus-lower", duelIndex: 98, nodeType: "REWARD_NEXUS", title: "Moneda", rewardNexus: 220, unlockRequirementNodeId: "story-ch1-duel-2", position: { x: 2080, y: 1220 } }),
    v({ id: "story-ch1-event-scout-log", duelIndex: 99, nodeType: "EVENT", title: "Evento", unlockRequirementNodeId: "story-ch1-reward-nexus-lower", position: { x: 2340, y: 1220 } }),
    v({ id: "story-ch1-path-branch-2", duelIndex: 100, nodeType: "MOVE", title: "Bifurcación", unlockRequirementNodeId: "story-ch1-event-scout-log", position: { x: 2600, y: 1220 } }),
    v({ id: "story-ch1-path-upper-branch-2", duelIndex: 101, nodeType: "MOVE", title: "Ruta Superior", unlockRequirementNodeId: "story-ch1-path-branch-2", position: { x: 2600, y: 1000 } }),
    v({ id: "story-ch1-reward-card-elite", duelIndex: 102, nodeType: "REWARD_CARD", title: "Carta", rewardCardId: "trap-kernel-panic", unlockRequirementNodeId: "story-ch1-duel-3", position: { x: 3120, y: 1000 } }),
    v({ id: "story-ch1-path-lower-branch-nexus", duelIndex: 103, nodeType: "REWARD_NEXUS", title: "Moneda", rewardNexus: 280, unlockRequirementNodeId: "story-ch1-path-branch-2", position: { x: 2860, y: 1420 } }),
    v({ id: "story-ch1-path-lower-final-blank", duelIndex: 104, nodeType: "MOVE", title: "Tramo Final", unlockRequirementNodeId: "story-ch2-duel-3", position: { x: 3380, y: 1420 } }),
    v({ id: "story-ch1-transition-to-act2", duelIndex: 105, nodeType: "EVENT", title: "Puerta de Acto", unlockRequirementNodeId: "story-ch2-duel-4", position: { x: 3900, y: 1420 } }),
  ],
  platforms: [
    { id: "act1-p-1", position: { x: 260, y: 980 }, size: 170, style: "METAL" },
    { id: "act1-p-2", position: { x: 520, y: 980 }, size: 170, style: "METAL" },
    { id: "act1-p-3", position: { x: 780, y: 980 }, size: 170, style: "NEON" },
    { id: "act1-p-4", position: { x: 1040, y: 980 }, size: 170, style: "RUIN" },
    { id: "act1-p-5", position: { x: 1300, y: 760 }, size: 170, style: "METAL" },
    { id: "act1-p-6", position: { x: 1560, y: 760 }, size: 170, style: "NEON" },
    { id: "act1-p-7", position: { x: 1820, y: 760 }, size: 170, style: "RUIN" },
    { id: "act1-p-8", position: { x: 1300, y: 1220 }, size: 170, style: "METAL" },
    { id: "act1-p-9", position: { x: 1560, y: 1220 }, size: 170, style: "RUIN" },
    { id: "act1-p-10", position: { x: 1820, y: 1220 }, size: 170, style: "NEON" },
    { id: "act1-p-11", position: { x: 2080, y: 1220 }, size: 170, style: "RUIN" },
    { id: "act1-p-12", position: { x: 2340, y: 1220 }, size: 170, style: "METAL" },
    { id: "act1-p-13", position: { x: 2600, y: 1220 }, size: 170, style: "NEON" },
    { id: "act1-p-14", position: { x: 2600, y: 1000 }, size: 170, style: "METAL" },
    { id: "act1-p-15", position: { x: 2860, y: 1000 }, size: 170, style: "RUIN" },
    { id: "act1-p-16", position: { x: 3120, y: 1000 }, size: 170, style: "METAL" },
    { id: "act1-p-17", position: { x: 2860, y: 1420 }, size: 170, style: "RUIN" },
    { id: "act1-p-18", position: { x: 3120, y: 1420 }, size: 170, style: "METAL" },
    { id: "act1-p-19", position: { x: 3380, y: 1420 }, size: 170, style: "RUIN" },
    { id: "act1-p-20", position: { x: 3640, y: 1420 }, size: 170, style: "NEON" },
    { id: "act1-p-21", position: { x: 3900, y: 1420 }, size: 170, style: "METAL" },
  ],
};
