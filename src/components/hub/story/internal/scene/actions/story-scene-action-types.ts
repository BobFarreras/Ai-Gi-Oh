// src/components/hub/story/internal/scene/actions/story-scene-action-types.ts - Contratos tipados para las acciones de movimiento/interacción de StoryScene.
import { IStoryMapNodeRuntime } from "@/services/story/story-map-runtime-data";
import { IStoryAvatarVisualTarget } from "@/components/hub/story/internal/scene/types/story-avatar-visual-target";

export interface IStoryInteractResponse {
  interactionCountForNode: number;
}

export interface IStoryApiErrorResponse {
  message?: string;
}

export type StoryRewardTone = "NEXUS" | "CARD";
export type StorySmartActionMode = "MOVE" | "PRIMARY" | "MOVE_AND_PRIMARY" | "DISABLED";

export interface IStoryCollectVisual {
  assetSrc: string;
  assetAlt: string;
  tone: StoryRewardTone;
}

export interface ICreateStorySceneActionsParams {
  selectedNodeId: string | null;
  selectedNode: IStoryMapNodeRuntime | null;
  currentNodeId: string | null;
  nodesById: Record<string, IStoryMapNodeRuntime>;
  isMoving: boolean;
  smartActionMode: StorySmartActionMode;
  setIsMoving: (value: boolean) => void;
  setIsInteracting: (value: boolean) => void;
  setMovementError: (value: string | null) => void;
  setInteractionFeedback: (value: string | null) => void;
  setCurrentNodeId: (nodeId: string) => void;
  setAvatarVisualTarget: (value: IStoryAvatarVisualTarget | null) => void;
  setDuelFocusNodeId: (value: string | null) => void;
  setFloatingReward: (value: { label: string; tone: StoryRewardTone } | null) => void;
  setCollectingRewardNodeId: (value: string | null) => void;
  setCollectingRewardVisual: (value: IStoryCollectVisual | null) => void;
  setPendingCenterNodeId: (value: string | null) => void;
  markNodeCompleted: (nodeId: string) => void;
  sceneSfx: {
    playMove: () => void;
    playDuelStart: () => void;
    playRewardNexus: () => void;
    playRewardCard: () => void;
  };
  navigateTo: (href: string) => void;
  requestActTransition: (actId: number) => void;
  startInteractionDialog: (node: IStoryMapNodeRuntime, interactionCountForNode: number) => boolean;
  requestNodeSubmission: (nodeId: string) => Promise<string | null>;
  hasSeenPreDuelDialogue: (nodeId: string) => boolean;
  markPreDuelDialogueSeen: (nodeId: string) => void;
  scheduleAutoStartDuelAfterDialogue: (nodeId: string) => void;
}

