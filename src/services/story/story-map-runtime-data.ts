// src/services/story/story-map-runtime-data.ts - Tipos de runtime para renderizar mapa de nodos Story y su estado de desbloqueo.
import { StoryOpponentDifficulty } from "@/core/entities/opponent/IStoryDuelDefinition";
import { IPlayerStoryHistoryEvent } from "@/core/entities/story/IPlayerStoryHistoryEvent";
import { StoryWorldNodeType } from "@/core/services/story/world/story-world-types";

export interface IStoryMapNodeRuntime {
  id: string;
  chapter: number;
  duelIndex: number;
  title: string;
  opponentName: string;
  nodeType: StoryWorldNodeType;
  difficulty: StoryOpponentDifficulty;
  rewardNexus: number;
  rewardPlayerExperience: number;
  isBossDuel: boolean;
  isCompleted: boolean;
  isUnlocked: boolean;
  href: string;
}

export interface IStoryMapRuntimeData {
  playerId: string;
  nodes: IStoryMapNodeRuntime[];
  currentNodeId: string | null;
  history: IPlayerStoryHistoryEvent[];
}
