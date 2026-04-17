// src/components/hub/story/internal/map/types/story-circuit-map.types.ts - Tipos compartidos del contenedor StoryCircuitMap.
import { IStoryAvatarVisualTarget } from "@/components/hub/story/internal/scene/types/story-avatar-visual-target";
import { IStoryMapNodeRuntime } from "@/services/story/story-map-runtime-data";

export interface IStoryMapRewardVisual {
  assetSrc: string;
  assetAlt: string;
  tone: "NEXUS" | "CARD";
}

export interface IStoryMapFloatingReward {
  label: string;
  tone: "NEXUS" | "CARD";
}

export interface StoryCircuitMapProps {
  nodes: IStoryMapNodeRuntime[];
  currentNodeId: string | null;
  selectedNodeId: string | null;
  avatarVisualTarget?: IStoryAvatarVisualTarget | null;
  shouldPlayActEntryAnimation?: boolean;
  duelFocusNodeId?: string | null;
  floatingReward?: IStoryMapFloatingReward | null;
  collectingRewardNodeId?: string | null;
  collectingRewardVisual?: IStoryMapRewardVisual | null;
  retreatingNodeId?: string | null;
  isInteractionLocked?: boolean;
  isMobileVerticalFlow?: boolean;
  centerRequestKey?: number;
  isSoundtrackMuted?: boolean;
  onToggleSoundtrackMute?: () => void;
  onExitToHub?: () => void;
  onSelectNode: (nodeId: string | null) => void;
  onRewardCollectAnimationComplete?: () => void;
  onRetreatAnimationComplete?: () => void;
}
