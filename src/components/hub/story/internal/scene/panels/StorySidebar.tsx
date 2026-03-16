// src/components/hub/story/internal/scene/panels/StorySidebar.tsx - Panel lateral Story orquestado por subcomponentes SRP.
"use client";

import { AnimatePresence } from "framer-motion";
import { IStoryChapterBriefing } from "@/services/story/build-story-chapter-briefing";
import { IStoryMapNodeRuntime } from "@/services/story/story-map-runtime-data";
import { StorySidebarHeader } from "./internal/StorySidebarHeader";
import { StorySidebarEmptyState } from "./internal/StorySidebarEmptyState";
import { StorySidebarNodeContent } from "./internal/StorySidebarNodeContent";
import { buildStorySidebarNodeViewModel } from "./internal/story-sidebar-view-model";

interface StorySidebarProps {
  briefing: IStoryChapterBriefing;
  selectedNode: IStoryMapNodeRuntime | null;
  isMoving: boolean;
  movementError: string | null;
  interactionFeedback: string | null;
  smartActionLabel: string;
  canRunSmartAction: boolean;
  isCompactMode?: boolean;
  onSmartAction: () => void;
  onDeselect: () => void;
}

export function StorySidebar(props: StorySidebarProps) {
  const viewModel = buildStorySidebarNodeViewModel(props.selectedNode);

  return (
    <aside className="relative flex h-full w-full flex-col overflow-x-hidden overflow-y-auto border-l border-cyan-500/40 bg-black/80 text-slate-100 shadow-[-15px_0_40px_rgba(6,182,212,0.08)] backdrop-blur-xl">
      <div className="pointer-events-none absolute inset-0 z-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.15)_50%)] bg-[length:100%_4px] opacity-40 mix-blend-overlay" />
      <div className="pointer-events-none absolute right-0 top-0 z-0 h-72 w-72 rounded-full bg-cyan-600/10 blur-[100px]" />
      <StorySidebarHeader briefing={props.briefing} isCompactMode={props.isCompactMode ?? false} />
      <div className={props.isCompactMode ? "relative z-10 flex flex-1 flex-col p-4" : "relative z-10 flex flex-1 flex-col p-6"}>
        <AnimatePresence mode="wait">
          {props.selectedNode ? (
            <StorySidebarNodeContent
              selectedNode={props.selectedNode}
              viewModel={viewModel}
              isMoving={props.isMoving}
              movementError={props.movementError}
              interactionFeedback={props.interactionFeedback}
              smartActionLabel={props.smartActionLabel}
              canRunSmartAction={props.canRunSmartAction}
              isCompactMode={props.isCompactMode ?? false}
              onSmartAction={props.onSmartAction}
              onDeselect={props.onDeselect}
            />
          ) : (
            <StorySidebarEmptyState isCompactMode={props.isCompactMode ?? false} />
          )}
        </AnimatePresence>
      </div>
    </aside>
  );
}
