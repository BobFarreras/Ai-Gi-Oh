// src/services/story/story-map-runtime-data.ts - Tipos de runtime para renderizar mapa de nodos Story y su estado de desbloqueo.
import { StoryOpponentDifficulty } from "@/core/entities/opponent/IStoryDuelDefinition";

export interface IStoryMapNodeRuntime {
  id: string;
  chapter: number;
  duelIndex: number;
  title: string;
  opponentName: string;
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
}
