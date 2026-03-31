// src/components/hub/story/internal/scene/view/StorySceneSidebarPane.tsx - Panel lateral Story aislado para simplificar composición de StoryScene.
import { StorySidebar } from "@/components/hub/story/internal/scene/panels/StorySidebar";
import { IStoryMapNodeRuntime } from "@/services/story/story-map-runtime-data";
import { IStoryChapterBriefing } from "@/services/story/build-story-chapter-briefing";

interface IStorySceneSidebarPaneProps {
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

export function StorySceneSidebarPane(props: IStorySceneSidebarPaneProps) {
  return (
    <div className="z-20 w-80 flex-shrink-0 border-r border-cyan-500/30 shadow-[10px_0_30px_rgba(0,0,0,0.8)] md:w-96">
      <StorySidebar
        briefing={props.briefing}
        selectedNode={props.selectedNode}
        isMoving={props.isBusy}
        movementError={props.movementError}
        interactionFeedback={props.interactionFeedback}
        smartActionLabel={props.smartActionLabel}
        canRunSmartAction={props.canRunSmartAction}
        onExitToHub={props.onExitToHub}
        onSmartAction={props.onSmartAction}
        onDeselect={props.onDeselect}
      />
    </div>
  );
}
