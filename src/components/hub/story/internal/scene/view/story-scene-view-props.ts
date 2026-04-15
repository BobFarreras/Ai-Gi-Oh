// src/components/hub/story/internal/scene/view/story-scene-view-props.ts - Contratos compartidos de presentación para layouts Story desktop/mobile.
import { IStoryMapNodeRuntime } from "@/services/story/story-map-runtime-data";
import { IStoryChapterBriefing } from "@/services/story/build-story-chapter-briefing";
import {
  IStoryInteractionCinematicVideo,
  IStoryInteractionDialogueLine,
} from "@/services/story/story-node-interaction-dialogue-types";
import { IStoryAvatarVisualTarget } from "@/components/hub/story/internal/scene/types/story-avatar-visual-target";

export interface IStorySceneSidebarViewProps {
  briefing: IStoryChapterBriefing;
  selectedNode: IStoryMapNodeRuntime | null;
  isBusy: boolean;
  movementError: string | null;
  interactionFeedback: string | null;
  smartActionLabel: string;
  canRunSmartAction: boolean;
  onExitToHub: () => void;
  onSmartAction: () => void;
  onDeselect: () => void;
}

export interface IStorySceneMapViewProps {
  nodes: IStoryMapNodeRuntime[];
  currentNodeId: string | null;
  selectedNodeId: string | null;
  avatarVisualTarget: IStoryAvatarVisualTarget | null;
  duelFocusNodeId: string | null;
  floatingReward: { label: string; tone: "NEXUS" | "CARD" } | null;
  collectingRewardNodeId: string | null;
  collectingRewardVisual: { assetSrc: string; assetAlt: string; tone: "NEXUS" | "CARD" } | null;
  retreatingNodeId: string | null;
  isBusy: boolean;
  smartActionLabel?: string;
  canRunSmartAction?: boolean;
  canMoveSelectedNode?: boolean;
  actTransitionTargetId: number | null;
  shouldPlayActEntryAnimation?: boolean;
  isMobileVerticalFlow?: boolean;
  centerRequestKey?: number;
  onSelectNode: (nodeId: string | null) => void;
  onMoveSelectedNode?: () => void;
  onRequestCenterPlayer?: () => void;
  onExitToHub?: () => void;
  isSoundtrackMuted?: boolean;
  onToggleSoundtrackMute?: () => void;
  onRewardCollectAnimationComplete: () => void;
  onRetreatAnimationComplete: () => void;
  dialog: {
    isOpen: boolean;
    title: string;
    cinematicVideo: IStoryInteractionCinematicVideo | null;
    line: IStoryInteractionDialogueLine | null;
    onNext: () => void;
    onClose: () => void | Promise<void>;
  };
  submission: {
    isOpen: boolean;
    title: string;
    hint: string;
    placeholder: string;
    activationLabel: string;
    generatedCode: string;
    requiredKeys: Array<{ id: string; label: string; isCollected: boolean }>;
    onCancel: () => void;
    onSubmit: (value: string) => void;
  };
}
