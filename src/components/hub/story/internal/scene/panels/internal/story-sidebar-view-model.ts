// src/components/hub/story/internal/scene/panels/internal/story-sidebar-view-model.ts - Calcula datos derivados de presentación del panel Story.
import { IStoryMapNodeRuntime } from "@/services/story/story-map-runtime-data";

export interface IStorySidebarNodeViewModel {
  isActiveDuelNode: boolean;
  isBossNode: boolean;
  nodeTitle: string;
  nodeOpponent: string | null;
  nodeDifficulty: string;
  nodeReward: number;
  difficultyToneClassName: string;
}

/**
 * Centraliza las decisiones de render para mantener el componente de vista sin lógica condicional extensa.
 */
export function buildStorySidebarNodeViewModel(selectedNode: IStoryMapNodeRuntime | null): IStorySidebarNodeViewModel {
  const isActiveDuelNode = (selectedNode?.nodeType === "DUEL" || selectedNode?.nodeType === "BOSS") && !selectedNode?.isCompleted;
  const nodeDifficulty = isActiveDuelNode ? selectedNode?.difficulty ?? "N/A" : "N/A";
  const difficultyToneClassName =
    selectedNode?.difficulty === "BOSS" || selectedNode?.difficulty === "MYTHIC"
      ? "text-rose-200 border-rose-500/60 bg-rose-950/40 shadow-[0_0_15px_rgba(244,63,94,0.3)]"
      : selectedNode?.difficulty === "ELITE"
        ? "text-amber-200 border-amber-500/60 bg-amber-950/40 shadow-[0_0_15px_rgba(245,158,11,0.3)]"
        : "text-cyan-200 border-cyan-500/60 bg-cyan-950/40 shadow-[0_0_15px_rgba(6,182,212,0.3)]";

  return {
    isActiveDuelNode,
    isBossNode: selectedNode?.nodeType === "BOSS",
    nodeTitle: isActiveDuelNode ? selectedNode?.title ?? "Plataforma Táctica" : "Plataforma Táctica",
    nodeOpponent: isActiveDuelNode ? selectedNode?.opponentName ?? null : null,
    nodeDifficulty,
    nodeReward: isActiveDuelNode ? selectedNode?.rewardNexus ?? 0 : 0,
    difficultyToneClassName,
  };
}
