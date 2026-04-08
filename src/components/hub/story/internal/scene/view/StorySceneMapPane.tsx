// src/components/hub/story/internal/scene/view/StorySceneMapPane.tsx - Contenedor del mapa Story y diálogo narrativo desacoplado de StoryScene.
import { StoryCircuitMap } from "@/components/hub/story/StoryCircuitMap";
import { StoryNodeInteractionDialog } from "@/components/hub/story/internal/scene/dialog/StoryNodeInteractionDialog";
import { StorySubmissionTerminalDialog } from "@/components/hub/story/internal/scene/dialog/StorySubmissionTerminalDialog";
import { StoryActTransitionOverlay } from "@/components/hub/story/internal/scene/view/StoryActTransitionOverlay";
import { IStoryMapNodeRuntime } from "@/services/story/story-map-runtime-data";
import {
  IStoryInteractionCinematicVideo,
  IStoryInteractionDialogueLine,
} from "@/services/story/story-node-interaction-dialogue-types";
import { IStoryAvatarVisualTarget } from "@/components/hub/story/internal/scene/types/story-avatar-visual-target";

interface IStorySceneMapPaneProps {
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
  actTransitionTargetId: number | null;
  shouldPlayActEntryAnimation?: boolean;
  isMobileVerticalFlow?: boolean;
  onSelectNode: (nodeId: string | null) => void;
  centerRequestKey?: number;
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
}

export function StorySceneMapPane(props: IStorySceneMapPaneProps) {
  return (
    <div className="relative z-0 flex-1 overflow-hidden bg-[#050810]">
      <StoryCircuitMap
        nodes={props.nodes}
        currentNodeId={props.currentNodeId}
        selectedNodeId={props.selectedNodeId}
        avatarVisualTarget={props.avatarVisualTarget}
        duelFocusNodeId={props.duelFocusNodeId}
        floatingReward={props.floatingReward}
        collectingRewardNodeId={props.collectingRewardNodeId}
        collectingRewardVisual={props.collectingRewardVisual}
        retreatingNodeId={props.retreatingNodeId}
        isInteractionLocked={props.isBusy}
        shouldPlayActEntryAnimation={props.shouldPlayActEntryAnimation ?? false}
        isMobileVerticalFlow={props.isMobileVerticalFlow ?? false}
        centerRequestKey={props.centerRequestKey ?? 0}
        isSoundtrackMuted={props.isSoundtrackMuted ?? false}
        onToggleSoundtrackMute={props.onToggleSoundtrackMute}
        onSelectNode={props.onSelectNode}
        onRewardCollectAnimationComplete={props.onRewardCollectAnimationComplete}
        onRetreatAnimationComplete={props.onRetreatAnimationComplete}
      />
      <StoryNodeInteractionDialog
        isOpen={props.dialog.isOpen}
        title={props.dialog.title}
        cinematicVideo={props.dialog.cinematicVideo}
        line={props.dialog.line}
        onNext={props.dialog.onNext}
        onClose={props.dialog.onClose}
      />
      <StorySubmissionTerminalDialog
        isOpen={props.submission.isOpen}
        title={props.submission.title}
        hint={props.submission.hint}
        placeholder={props.submission.placeholder}
        onCancel={props.submission.onCancel}
        onSubmit={props.submission.onSubmit}
      />
      <StoryActTransitionOverlay targetActId={props.actTransitionTargetId} />
    </div>
  );
}
