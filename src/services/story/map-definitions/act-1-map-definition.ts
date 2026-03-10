// src/services/story/map-definitions/act-1-map-definition.ts - Definición visual editable del acto 1 del mapa Story.
import { IStoryActMapDefinition } from "@/services/story/map-definitions/story-map-definition-types";

/**
 * Layout del Acto 1. Mantiene ids de BD para desacoplar diseño visual del motor.
 */
export const storyAct1MapDefinition: IStoryActMapDefinition = {
  act: 1,
  nodes: [
    { id: "story-ch1-duel-1", position: { x: 1000, y: 1650 } },
    {
      id: "story-ch1-duel-2",
      unlockRequirementNodeId: "story-ch1-duel-1",
      position: { x: 1000, y: 1320 },
    },
    {
      id: "story-ch1-duel-3",
      unlockRequirementNodeId: "story-ch1-duel-2",
      position: { x: 1000, y: 980 },
    },
  ],
  virtualNodes: [
    {
      id: "story-ch1-event-briefing",
      chapter: 1,
      duelIndex: 101,
      nodeType: "EVENT",
      title: "Terminal de Briefing",
      opponentName: "Canal de Mando",
      difficulty: "ROOKIE",
      rewardNexus: 0,
      rewardPlayerExperience: 0,
      isBossDuel: false,
      unlockRequirementNodeId: "story-ch1-duel-1",
      href: "#",
      position: { x: 700, y: 1490 },
    },
    {
      id: "story-ch1-reward-cache",
      chapter: 1,
      duelIndex: 102,
      nodeType: "REWARD_NEXUS",
      title: "Cache de Recursos",
      opponentName: "Nodo de Recompensa",
      difficulty: "ROOKIE",
      rewardNexus: 80,
      rewardPlayerExperience: 0,
      isBossDuel: false,
      unlockRequirementNodeId: "story-ch1-duel-2",
      href: "#",
      position: { x: 1300, y: 1180 },
    },
  ],
};
