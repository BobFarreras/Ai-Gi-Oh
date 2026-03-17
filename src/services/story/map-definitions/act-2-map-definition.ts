// src/services/story/map-definitions/act-2-map-definition.ts - Definición visual del Acto 2 con triple bifurcación y puente bloqueado hacia BOSS.
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
 * Acto 2 real:
 * entrada -> economía/evento -> bifurcación (arriba/centro/abajo) -> puente al BOSS.
 */
export const storyAct2MapDefinition: IStoryActMapDefinition = {
  act: 2,
  nodes: [
    { id: "story-ch2-duel-1", unlockRequirementNodeId: "story-ch2-branch-top-a", position: { x: 3900, y: 700 } },
    { id: "story-ch2-duel-2", unlockRequirementNodeId: "story-ch2-branch-center-b", position: { x: 3900, y: 980 } },
    { id: "story-ch2-duel-5", unlockRequirementNodeId: "story-ch2-duel-2", position: { x: 4160, y: 980 } },
    { id: "story-ch2-duel-6", unlockRequirementNodeId: "story-ch2-branch-bottom-c", position: { x: 3900, y: 1260 } },
    { id: "story-ch2-duel-7", unlockRequirementNodeId: "story-ch2-branch-lower-up-event", position: { x: 4420, y: 1120 } },
    { id: "story-ch2-duel-8", unlockRequirementNodeId: "story-ch2-duel-7", position: { x: 4680, y: 980 } },
    { id: "story-ch2-duel-9", unlockRequirementNodeId: "story-ch2-boss-bridge", position: { x: 5200, y: 1260 } },
  ],
  virtualNodes: [
    v({ id: "story-ch2-player-start", duelIndex: 199, nodeType: "MOVE", title: "Plataforma Inicial", unlockRequirementNodeId: "story-ch1-transition-to-act2", position: { x: 2600, y: 980 } }),
    v({ id: "story-ch2-transition-to-act1", duelIndex: 200, nodeType: "EVENT", title: "Retorno de Acto", unlockRequirementNodeId: "story-ch2-player-start", position: { x: 2340, y: 980 } }),
    v({ id: "story-ch2-path-entry", duelIndex: 201, nodeType: "MOVE", title: "Entrada", unlockRequirementNodeId: "story-ch2-player-start", position: { x: 2860, y: 980 } }),
    v({ id: "story-ch2-path-blank-a", duelIndex: 202, nodeType: "MOVE", title: "Paso", unlockRequirementNodeId: "story-ch2-path-entry", position: { x: 3120, y: 980 } }),
    v({ id: "story-ch2-reward-nexus-a", duelIndex: 203, nodeType: "REWARD_NEXUS", title: "Moneda", rewardNexus: 260, unlockRequirementNodeId: "story-ch2-path-blank-a", position: { x: 3380, y: 980 } }),
    v({ id: "story-ch2-event-core", duelIndex: 204, nodeType: "EVENT", title: "Evento", unlockRequirementNodeId: "story-ch2-reward-nexus-a", position: { x: 3640, y: 980 } }),

    v({ id: "story-ch2-branch-top-a", duelIndex: 205, nodeType: "MOVE", title: "Ruta Superior", unlockRequirementNodeId: "story-ch2-event-core", position: { x: 3640, y: 700 } }),
    v({ id: "story-ch2-reward-card-top", duelIndex: 206, nodeType: "REWARD_CARD", title: "Carta", rewardCardId: "exec-draw-1", unlockRequirementNodeId: "story-ch2-duel-1", position: { x: 4160, y: 700 } }),

    v({ id: "story-ch2-branch-center-a", duelIndex: 207, nodeType: "REWARD_NEXUS", title: "Moneda", rewardNexus: 220, unlockRequirementNodeId: "story-ch2-event-core", position: { x: 3640, y: 840 } }),
    v({ id: "story-ch2-branch-center-b", duelIndex: 208, nodeType: "MOVE", title: "Paso", unlockRequirementNodeId: "story-ch2-branch-center-a", position: { x: 3900, y: 840 } }),

    v({ id: "story-ch2-branch-bottom-a", duelIndex: 209, nodeType: "MOVE", title: "Ruta Inferior", unlockRequirementNodeId: "story-ch2-event-core", position: { x: 3640, y: 1260 } }),
    v({ id: "story-ch2-branch-bottom-b", duelIndex: 210, nodeType: "MOVE", title: "Paso", unlockRequirementNodeId: "story-ch2-branch-bottom-a", position: { x: 3900, y: 1260 } }),
    v({ id: "story-ch2-branch-bottom-c", duelIndex: 211, nodeType: "REWARD_NEXUS", title: "Moneda", rewardNexus: 320, unlockRequirementNodeId: "story-ch2-branch-bottom-b", position: { x: 4160, y: 1260 } }),
    v({ id: "story-ch2-branch-lower-fork", duelIndex: 212, nodeType: "MOVE", title: "Bifurcación", unlockRequirementNodeId: "story-ch2-duel-6", position: { x: 4420, y: 1260 } }),

    v({ id: "story-ch2-branch-lower-up-event", duelIndex: 213, nodeType: "EVENT", title: "Evento", unlockRequirementNodeId: "story-ch2-branch-lower-fork", position: { x: 4420, y: 1120 } }),
    v({ id: "story-ch2-branch-lower-up-link", duelIndex: 214, nodeType: "MOVE", title: "Paso", unlockRequirementNodeId: "story-ch2-duel-7", position: { x: 4680, y: 1120 } }),

    v({ id: "story-ch2-branch-lower-down-a", duelIndex: 215, nodeType: "MOVE", title: "Paso", unlockRequirementNodeId: "story-ch2-branch-lower-fork", position: { x: 4680, y: 1260 } }),
    v({ id: "story-ch2-branch-lower-down-b", duelIndex: 216, nodeType: "REWARD_NEXUS", title: "Moneda", rewardNexus: 360, unlockRequirementNodeId: "story-ch2-branch-lower-down-a", position: { x: 4940, y: 1260 } }),
    // Puente visual: no se puede activar sin derrotar la segunda Helena.
    v({ id: "story-ch2-boss-bridge", duelIndex: 217, nodeType: "MOVE", title: "Puente", unlockRequirementNodeId: "story-ch2-duel-8", position: { x: 5200, y: 1120 } }),
  ],
  platforms: [
    { id: "act2-p-0", position: { x: 2340, y: 980 }, size: 170, style: "RUIN" },
    { id: "act2-p-1", position: { x: 2600, y: 980 }, size: 170, style: "METAL" },
    { id: "act2-p-2", position: { x: 2860, y: 980 }, size: 170, style: "RUIN" },
    { id: "act2-p-3", position: { x: 3120, y: 980 }, size: 170, style: "METAL" },
    { id: "act2-p-4", position: { x: 3380, y: 980 }, size: 170, style: "NEON" },
    { id: "act2-p-5", position: { x: 3640, y: 980 }, size: 170, style: "RUIN" },
    { id: "act2-p-6", position: { x: 3640, y: 700 }, size: 170, style: "METAL" },
    { id: "act2-p-7", position: { x: 3900, y: 700 }, size: 170, style: "NEON" },
    { id: "act2-p-8", position: { x: 4160, y: 700 }, size: 170, style: "RUIN" },
    { id: "act2-p-9", position: { x: 3900, y: 980 }, size: 170, style: "METAL" },
    { id: "act2-p-10", position: { x: 4160, y: 980 }, size: 170, style: "NEON" },
    { id: "act2-p-11", position: { x: 3640, y: 1260 }, size: 170, style: "RUIN" },
    { id: "act2-p-12", position: { x: 3900, y: 1260 }, size: 170, style: "METAL" },
    { id: "act2-p-13", position: { x: 4160, y: 1260 }, size: 170, style: "NEON" },
    { id: "act2-p-14", position: { x: 4420, y: 1260 }, size: 170, style: "RUIN" },
    { id: "act2-p-15", position: { x: 4420, y: 1120 }, size: 170, style: "METAL" },
    { id: "act2-p-16", position: { x: 4680, y: 1120 }, size: 170, style: "NEON" },
    { id: "act2-p-17", position: { x: 4680, y: 1260 }, size: 170, style: "RUIN" },
    { id: "act2-p-18", position: { x: 4940, y: 1260 }, size: 170, style: "METAL" },
    { id: "act2-p-19", position: { x: 5200, y: 1120 }, size: 170, style: "NEON" },
    { id: "act2-p-20", position: { x: 5200, y: 1260 }, size: 170, style: "RUIN" },
    { id: "act2-p-21", position: { x: 3640, y: 840 }, size: 170, style: "METAL" },
    { id: "act2-p-22", position: { x: 3900, y: 840 }, size: 170, style: "NEON" },
  ],
};
