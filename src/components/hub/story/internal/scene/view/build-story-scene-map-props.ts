// src/components/hub/story/internal/scene/view/build-story-scene-map-props.ts - Compone props del mapa Story con contratos de diálogo y submission para layouts.
import { IStorySceneMapViewProps } from "@/components/hub/story/internal/scene/view/story-scene-view-props";
import { IStoryCollectVisual, IStorySubmissionDialogState } from "@/components/hub/story/internal/scene/types/story-scene-local-types";
import { IStoryMapNodeRuntime } from "@/services/story/story-map-runtime-data";
import { IStoryAvatarVisualTarget } from "@/components/hub/story/internal/scene/types/story-avatar-visual-target";

/**
 * Normaliza estado transitorio para la vista del mapa en desktop y móvil.
 */
export function buildStorySceneMapProps(input: {
  nodes: IStoryMapNodeRuntime[];
  currentNodeId: string | null;
  selectedNodeId: string | null;
  avatarVisualTarget: IStoryAvatarVisualTarget | null;
  duelFocusNodeId: string | null;
  floatingReward: { label: string; tone: "NEXUS" | "CARD" } | null;
  collectingRewardNodeId: string | null;
  collectingRewardVisual: IStoryCollectVisual | null;
  retreatingNodeId: string | null;
  isBusy: boolean;
  smartActionLabel: string;
  canRunSmartAction: boolean;
  canMoveSelectedNode: boolean;
  actTransitionTargetId: number | null;
  shouldPlayActEntryAnimation: boolean;
  centerRequestKey: number;
  isSoundtrackMuted: boolean;
  dialog: IStorySceneMapViewProps["dialog"];
  submissionDialog: IStorySubmissionDialogState | null;
  onSelectNode: (nodeId: string | null) => void;
  onMoveSelectedNode: () => void;
  onRequestCenterPlayer: () => void;
  onExitToHub: () => void;
  onToggleSoundtrackMute: () => void;
  onRewardCollectAnimationComplete: () => void;
  onRetreatAnimationComplete: () => void;
  setSubmissionDialog: (value: IStorySubmissionDialogState | null) => void;
}): IStorySceneMapViewProps {
  return {
    nodes: input.nodes,
    currentNodeId: input.currentNodeId,
    selectedNodeId: input.selectedNodeId,
    avatarVisualTarget: input.avatarVisualTarget,
    duelFocusNodeId: input.duelFocusNodeId,
    floatingReward: input.floatingReward,
    collectingRewardNodeId: input.collectingRewardNodeId,
    collectingRewardVisual: input.collectingRewardVisual,
    retreatingNodeId: input.retreatingNodeId,
    isBusy: input.isBusy,
    smartActionLabel: input.smartActionLabel,
    canRunSmartAction: input.canRunSmartAction,
    canMoveSelectedNode: input.canMoveSelectedNode,
    actTransitionTargetId: input.actTransitionTargetId,
    shouldPlayActEntryAnimation: input.shouldPlayActEntryAnimation,
    centerRequestKey: input.centerRequestKey,
    onSelectNode: input.onSelectNode,
    onMoveSelectedNode: input.onMoveSelectedNode,
    onRequestCenterPlayer: input.onRequestCenterPlayer,
    onExitToHub: input.onExitToHub,
    isSoundtrackMuted: input.isSoundtrackMuted,
    onToggleSoundtrackMute: input.onToggleSoundtrackMute,
    onRewardCollectAnimationComplete: input.onRewardCollectAnimationComplete,
    onRetreatAnimationComplete: input.onRetreatAnimationComplete,
    dialog: input.dialog,
    submission: {
      isOpen: Boolean(input.submissionDialog),
      title: input.submissionDialog?.title ?? "Submission",
      hint: input.submissionDialog?.hint ?? "",
      placeholder: input.submissionDialog?.placeholder ?? "",
      activationLabel: input.submissionDialog?.activationLabel ?? "Conectar",
      generatedCode: input.submissionDialog?.generatedCode ?? "",
      requiredKeys: input.submissionDialog?.requiredKeys ?? [],
      onCancel: () => {
        if (!input.submissionDialog) return;
        input.submissionDialog.resolve(null);
        input.setSubmissionDialog(null);
      },
      onSubmit: (value) => {
        if (!input.submissionDialog) return;
        input.submissionDialog.resolve(value);
        input.setSubmissionDialog(null);
      },
    },
  };
}

