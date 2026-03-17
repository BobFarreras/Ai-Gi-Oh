// src/components/hub/story/internal/scene/view/StorySceneDesktopLayout.tsx - Layout desktop de Story con sidebar fijo y mapa a pantalla completa.
import { StorySceneMapPane } from "@/components/hub/story/internal/scene/view/StorySceneMapPane";
import { StorySceneSidebarPane } from "@/components/hub/story/internal/scene/view/StorySceneSidebarPane";
import { IStorySceneMapViewProps, IStorySceneSidebarViewProps } from "./story-scene-view-props";

interface IStorySceneDesktopLayoutProps {
  sidebar: IStorySceneSidebarViewProps;
  map: IStorySceneMapViewProps;
}

export function StorySceneDesktopLayout(props: IStorySceneDesktopLayoutProps) {
  return (
    <div className="flex h-full w-full flex-1 overflow-hidden border-t border-cyan-900/50 bg-black font-sans">
      <StorySceneSidebarPane {...props.sidebar} />
      <StorySceneMapPane {...props.map} />
    </div>
  );
}
