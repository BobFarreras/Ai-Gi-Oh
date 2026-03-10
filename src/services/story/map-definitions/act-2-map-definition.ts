// src/services/story/map-definitions/act-2-map-definition.ts - Definición visual editable del acto 2 del mapa Story.
import { IStoryActMapDefinition } from "@/services/story/map-definitions/story-map-definition-types";

/**
 * Layout del Acto 2 con ligera bifurcación visual para anticipar mapa semi-abierto.
 */
export const storyAct2MapDefinition: IStoryActMapDefinition = {
  act: 2,
  nodes: [
    {
      id: "story-ch2-duel-1",
      unlockRequirementNodeId: "story-ch1-duel-3",
      position: { x: 860, y: 640 },
    },
    {
      id: "story-ch2-duel-2",
      unlockRequirementNodeId: "story-ch2-duel-1",
      position: { x: 1140, y: 420 },
    },
  ],
  virtualNodes: [
    {
      id: "story-ch2-event-signal",
      chapter: 2,
      duelIndex: 201,
      nodeType: "EVENT",
      title: "Señal Fantasma",
      opponentName: "Tráfico encriptado",
      difficulty: "STANDARD",
      rewardNexus: 0,
      rewardPlayerExperience: 0,
      isBossDuel: false,
      unlockRequirementNodeId: "story-ch2-duel-1",
      href: "#",
      position: { x: 640, y: 470 },
    },
    {
      id: "story-ch2-reward-card",
      chapter: 2,
      duelIndex: 202,
      nodeType: "REWARD_CARD",
      title: "Alijo de Carta",
      opponentName: "Contenedor seguro",
      difficulty: "STANDARD",
      rewardNexus: 0,
      rewardPlayerExperience: 120,
      isBossDuel: false,
      unlockRequirementNodeId: "story-ch2-duel-1",
      href: "#",
      position: { x: 1410, y: 540 },
    },
  ],
};
