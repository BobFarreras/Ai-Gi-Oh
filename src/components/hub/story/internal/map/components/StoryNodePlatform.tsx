// src/components/hub/story/internal/map/components/StoryNodePlatform.tsx - Renderiza la plataforma base seleccionable de cada nodo Story.
import { cn } from "@/lib/utils";

interface IStoryNodePlatformProps {
  isCompleted: boolean;
  isSelected: boolean;
  isCurrentNode: boolean;
}

export function StoryNodePlatform({
  isCompleted,
  isSelected,
  isCurrentNode,
}: IStoryNodePlatformProps) {
  return (
    <div
      className={cn(
        "absolute bottom-0 z-10 h-12 w-24 rounded-[50%] border-4 shadow-[0_10px_20px_rgba(0,0,0,0.8)] transition-colors duration-300",
        isCompleted
          ? "border-emerald-900 bg-emerald-950/80 shadow-[0_0_15px_rgba(16,185,129,0.3)]"
          : isSelected
            ? "border-cyan-400 bg-cyan-900 shadow-[0_0_30px_rgba(6,182,212,0.6)]"
            : "border-slate-700 bg-slate-900",
        isCurrentNode && "border-emerald-300 bg-emerald-900/70",
      )}
    />
  );
}
