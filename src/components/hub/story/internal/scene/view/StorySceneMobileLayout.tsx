// src/components/hub/story/internal/scene/view/StorySceneMobileLayout.tsx - Layout móvil Story con mapa full-screen y sidebar desplegable.
"use client";
import { useState } from "react";
import { StorySceneMapPane } from "@/components/hub/story/internal/scene/view/StorySceneMapPane";
import { StoryMobileSidebarSheet } from "@/components/hub/story/internal/scene/view/StoryMobileSidebarSheet";
import { IStorySceneMapViewProps, IStorySceneSidebarViewProps } from "./story-scene-view-props";

interface IStorySceneMobileLayoutProps {
  sidebar: IStorySceneSidebarViewProps;
  map: IStorySceneMapViewProps;
}

export function StorySceneMobileLayout(props: IStorySceneMobileLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  return (
    <div className="relative flex h-full w-full flex-1 overflow-hidden border-t border-cyan-900/50 bg-black font-sans">
      <StorySceneMapPane {...props.map} isMobileVerticalFlow />
      <div className="pointer-events-none absolute inset-x-3 bottom-[calc(env(safe-area-inset-bottom)+10px)] z-[60]">
        <div className="rounded-2xl border border-cyan-400/45 bg-black/88 p-2.5 shadow-[0_0_20px_rgba(34,211,238,0.2)] backdrop-blur-sm">
          <p className="px-1 pb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300">
            Acciones del nodo
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              aria-label="Mover al nodo seleccionado"
              onClick={() => props.map.onMoveSelectedNode?.()}
              disabled={!props.map.canMoveSelectedNode || props.map.isBusy}
              className="pointer-events-auto rounded-xl border border-emerald-400/65 px-2 py-2.5 text-[10px] font-black uppercase tracking-[0.12em] text-emerald-100 disabled:cursor-not-allowed disabled:border-emerald-700/40 disabled:text-emerald-200/40"
            >
              Mover
            </button>
            <button
              type="button"
              aria-label={isSidebarOpen ? "Cerrar detalle del nodo" : "Abrir detalle del nodo"}
              aria-expanded={isSidebarOpen}
              onClick={() => setIsSidebarOpen((value) => !value)}
              className="pointer-events-auto rounded-xl border border-cyan-400/65 px-2 py-2.5 text-[10px] font-black uppercase tracking-[0.12em] text-cyan-100"
            >
              Detalle
            </button>
          </div>
        </div>
      </div>
      <StoryMobileSidebarSheet
        {...props.sidebar}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
    </div>
  );
}
