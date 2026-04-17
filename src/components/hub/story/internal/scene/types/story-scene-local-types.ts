// src/components/hub/story/internal/scene/types/story-scene-local-types.ts - Tipos locales de estado UI para la escena Story y sus overlays transitorios.
import { IStoryMapNodeRuntime } from "@/services/story/story-map-runtime-data";

export interface IStoryCollectVisual {
  assetSrc: string;
  assetAlt: string;
  tone: "NEXUS" | "CARD";
}

export interface IStorySubmissionDialogState {
  nodeId: string;
  title: string;
  hint: string;
  placeholder: string;
  activationLabel: string;
  generatedCode: string;
  requiredKeys: Array<{ id: string; label: string; isCollected: boolean }>;
  resolve: (value: string | null) => void;
}

export interface IStoryPostWinTransitionState {
  pendingPostWinRetreatNodeId: string | null;
  consumedPostBossWinTransitionIds: string[];
  setPendingPostWinRetreatNodeId: (value: string | null) => void;
  setConsumedPostBossWinTransitionIds: (updater: (prev: string[]) => string[]) => void;
}

export interface IStoryInteractionFallbackNodeInput {
  id: string;
  sourceNode: IStoryMapNodeRuntime;
}

