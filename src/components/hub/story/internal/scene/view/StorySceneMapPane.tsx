// src/components/hub/story/internal/scene/view/StorySceneMapPane.tsx - Contenedor del mapa Story y diálogo narrativo desacoplado de StoryScene.
import { StoryCircuitMap } from "@/components/hub/story/StoryCircuitMap";
import { StoryNodeInteractionDialog } from "@/components/hub/story/internal/scene/dialog/StoryNodeInteractionDialog";
import { IStoryMapNodeRuntime } from "@/services/story/story-map-runtime-data";
import { IStoryInteractionDialogueLine } from "@/services/story/resolve-story-node-interaction-dialogue";

interface IStorySceneMapPaneProps {
  nodes: IStoryMapNodeRuntime[];
  currentNodeId: string | null;
  selectedNodeId: string | null;
  avatarVisualTarget: { nodeId: string; stance: "CENTER" | "SIDE" } | null;
  duelFocusNodeId: string | null;
  floatingReward: { label: string; tone: "NEXUS" | "CARD" } | null;
  collectingRewardNodeId: string | null;
  collectingRewardVisual: { assetSrc: string; assetAlt: string; tone: "NEXUS" | "CARD" } | null;
  retreatingNodeId: string | null;
  isBusy: boolean;
  onSelectNode: (nodeId: string | null) => void;
  onRewardCollectAnimationComplete: () => void;
  onRetreatAnimationComplete: () => void;
  dialog: {
    isOpen: boolean;
    title: string;
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
        onSelectNode={props.onSelectNode}
        onRewardCollectAnimationComplete={props.onRewardCollectAnimationComplete}
        onRetreatAnimationComplete={props.onRetreatAnimationComplete}
      />
      <StoryNodeInteractionDialog
        isOpen={props.dialog.isOpen}
        title={props.dialog.title}
        line={props.dialog.line}
        onNext={props.dialog.onNext}
        onClose={props.dialog.onClose}
      />
    </div>
  );
}
