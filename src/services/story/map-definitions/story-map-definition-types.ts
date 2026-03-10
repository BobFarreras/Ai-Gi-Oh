// src/services/story/map-definitions/story-map-definition-types.ts - Contratos para definir layout visual Story por acto.
import { StoryOpponentDifficulty } from "@/core/entities/opponent/IStoryDuelDefinition";
import { StoryWorldNodeType } from "@/core/services/story/world/story-world-types";

export interface IStoryMapVisualPosition {
  x: number;
  y: number;
}

export interface IStoryMapVisualNodeDefinition {
  id: string;
  unlockRequirementNodeId?: string | null;
  position: IStoryMapVisualPosition;
}

export interface IStoryMapVirtualNodeDefinition {
  id: string;
  chapter: number;
  duelIndex: number;
  nodeType: StoryWorldNodeType;
  title: string;
  opponentName: string;
  difficulty: StoryOpponentDifficulty;
  rewardNexus: number;
  rewardPlayerExperience: number;
  isBossDuel: boolean;
  unlockRequirementNodeId: string | null;
  href: string;
  position: IStoryMapVisualPosition;
}

export interface IStoryMapPlatformDefinition {
  id: string;
  position: IStoryMapVisualPosition;
  width: number;
  height: number;
  rotationDeg?: number;
  style: "METAL" | "NEON" | "RUIN";
}

export interface IStoryActMapDefinition {
  act: number;
  nodes: IStoryMapVisualNodeDefinition[];
  virtualNodes?: IStoryMapVirtualNodeDefinition[];
  platforms?: IStoryMapPlatformDefinition[];
}
