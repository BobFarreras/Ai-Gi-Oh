// src/components/hub/story/internal/scene/view/story-scene-view-props.ts - Contratos compartidos de presentación para layouts Story desktop/mobile.
import { IStoryMapNodeRuntime } from "@/services/story/story-map-runtime-data";
import { IStoryChapterBriefing } from "@/services/story/build-story-chapter-briefing";
import { IStoryInteractionDialogueLine } from "@/services/story/resolve-story-node-interaction-dialogue";

export interface IStorySceneSidebarViewProps {
  briefing: IStoryChapterBriefing;
  selectedNode: IStoryMapNodeRuntime | null;
  isBusy: boolean;
  movementError: string | null;
  interactionFeedback: string | null;
  smartActionLabel: string;
  canRunSmartAction: boolean;
  onSmartAction: () => void;
  onDeselect: () => void;
}

export interface IStorySceneMapViewProps {
  nodes: IStoryMapNodeRuntime[];
  currentNodeId: string | null;
  selectedNodeId: string | null;
  avatarVisualTarget: { nodeId: string; stance: "CENTER" | "SIDE" | "PORTAL" } | null;
  duelFocusNodeId: string | null;
  floatingReward: { label: string; tone: "NEXUS" | "CARD" } | null;
  collectingRewardNodeId: string | null;
  collectingRewardVisual: { assetSrc: string; assetAlt: string; tone: "NEXUS" | "CARD" } | null;
  retreatingNodeId: string | null;
  isBusy: boolean;
  canMoveSelectedNode?: boolean;
  actTransitionTargetId: number | null;
  shouldPlayActEntryAnimation?: boolean;
  isMobileVerticalFlow?: boolean;
  centerRequestKey?: number;
  onSelectNode: (nodeId: string | null) => void;
  onMoveSelectedNode?: () => void;
  onRequestCenterPlayer?: () => void;
  onExitToHub?: () => void;
  onRewardCollectAnimationComplete: () => void;
  onRetreatAnimationComplete: () => void;
  dialog: {
    isOpen: boolean;
    title: string;
    soundtrackUrl: string | null;
    line: IStoryInteractionDialogueLine | null;
    onNext: () => void;
    onClose: () => void | Promise<void>;
  };
}
