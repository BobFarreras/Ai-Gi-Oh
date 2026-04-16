// src/components/hub/story/internal/scene/view/build-story-scene-sidebar-props.ts - Construye props del panel lateral Story evitando ruido de wiring en StoryScene.
import { IStoryChapterBriefing } from "@/services/story/build-story-chapter-briefing";
import { IStoryMapNodeRuntime } from "@/services/story/story-map-runtime-data";
import { IStorySceneSidebarViewProps } from "@/components/hub/story/internal/scene/view/story-scene-view-props";

/**
 * Mapea estado/acciones del runtime Story al contrato de la vista lateral.
 */
export function buildStorySceneSidebarProps(input: {
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
}): IStorySceneSidebarViewProps {
  return {
    briefing: input.briefing,
    selectedNode: input.selectedNode,
    isBusy: input.isBusy,
    movementError: input.movementError,
    interactionFeedback: input.interactionFeedback,
    smartActionLabel: input.smartActionLabel,
    canRunSmartAction: input.canRunSmartAction,
    onExitToHub: input.onExitToHub,
    onSmartAction: input.onSmartAction,
    onDeselect: input.onDeselect,
  };
}

