// src/components/hub/story/internal/map/components/StoryNodePlatform.tsx - Renderiza la plataforma base seleccionable de cada nodo Story.
import { cn } from "@/lib/utils";

interface IStoryNodePlatformProps {
  isCompleted: boolean;
  isSelected: boolean;
  isCurrentNode: boolean;
  isMovePlatform: boolean;
  isStartNode: boolean;
}

export function StoryNodePlatform({
  isCompleted,
  isSelected,
  isCurrentNode,
  isMovePlatform,
  isStartNode,
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
    >
      <div
        className={cn(
          "absolute inset-2 rounded-[50%] border-2 blur-[1px]",
          isSelected ? "animate-pulse border-cyan-300" : "border-slate-800",
        )}
      />
      {isMovePlatform ? (
        <div
          className={cn(
            "absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-300/60 bg-cyan-400/25",
            isStartNode && "h-4 w-4 border-emerald-300/80 bg-emerald-400/35",
            isCurrentNode && "border-emerald-200 bg-emerald-400/45",
          )}
        />
      ) : null}
    </div>
  );
}
