// src/core/services/story/world/story-world-types.ts - Tipos del grafo de mundo Story y estado de progreso navegable.
import { IStoryDuelSummary } from "@/core/entities/opponent/IStoryDuelSummary";
import { StoryOpponentDifficulty } from "@/core/entities/opponent/IStoryDuelDefinition";

export type StoryWorldNodeType =
  | "MOVE"
  | "DUEL"
  | "BOSS"
  | "REWARD_CARD"
  | "REWARD_NEXUS"
  | "EVENT";

export interface IStoryWorldNode {
  id: string;
  chapter: number;
  duelIndex: number;
  title: string;
  opponentName: string;
  difficulty: StoryOpponentDifficulty;
  nodeType: StoryWorldNodeType;
  rewardNexus: number;
  rewardPlayerExperience: number;
  unlockRequirementNodeId: string | null;
  href: string;
}

export interface IStoryWorldEdge {
  fromNodeId: string;
  toNodeId: string;
}

export interface IStoryWorldGraph {
  nodes: IStoryWorldNode[];
  edges: IStoryWorldEdge[];
}

export interface IStoryWorldHistoryEvent {
  eventId: string;
  nodeId: string;
  kind: "MOVE" | "NODE_RESOLVED" | "REWARD_GRANTED" | "INTERACTION";
  createdAtIso: string;
  details: string;
}

export interface IStoryWorldProgressState {
  currentNodeId: string | null;
  completedNodeIds: string[];
  unlockedNodeIds: string[];
  history: IStoryWorldHistoryEvent[];
}

export type StoryWorldSeedNode = Pick<
  IStoryDuelSummary,
  | "id"
  | "chapter"
  | "duelIndex"
  | "title"
  | "opponentName"
  | "opponentDifficulty"
  | "rewardNexus"
  | "rewardPlayerExperience"
  | "unlockRequirementDuelId"
  | "isBossDuel"
>;
