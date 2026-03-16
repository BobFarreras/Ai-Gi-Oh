// src/services/story/story-map-runtime-data.ts - Tipos de runtime para renderizar mapa de nodos Story y su estado de desbloqueo.
import { StoryOpponentDifficulty } from "@/core/entities/opponent/IStoryDuelDefinition";
import { StoryWorldNodeType } from "@/core/services/story/world/story-world-types";

export interface IStoryMapNodeRuntime {
  id: string;
  chapter: number;
  duelIndex: number;
  title: string;
  opponentName: string;
  opponentAvatarUrl?: string | null;
  nodeType: StoryWorldNodeType;
  difficulty: StoryOpponentDifficulty;
  rewardNexus: number;
  rewardCardId?: string;
  rewardPlayerExperience: number;
  isBossDuel: boolean;
  isCompleted: boolean;
  isUnlocked: boolean;
  unlockRequirementNodeId?: string | null;
  href: string;
  isVirtualNode?: boolean;
  pathLinkFromNodeIds?: string[];
  position?: {
    x: number;
    y: number;
  };
}

export interface IStoryMapRuntimeData {
  playerId: string;
  nodes: IStoryMapNodeRuntime[];
  currentNodeId: string | null;
  activeActId: number;
  availableActIds: number[];
}
