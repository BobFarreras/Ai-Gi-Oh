// src/components/hub/story/internal/scene/panels/internal/StorySidebarHeader.tsx - Cabecera del panel Story con acto y directiva.
import { IStoryChapterBriefing } from "@/services/story/build-story-chapter-briefing";

interface IStorySidebarHeaderProps {
  briefing: IStoryChapterBriefing;
  isCompactMode: boolean;
  onExitToHub: () => void;
}

export function StorySidebarHeader({ briefing, isCompactMode, onExitToHub }: IStorySidebarHeaderProps) {
  return (
    <div className={isCompactMode ? "relative z-10 border-b border-cyan-500/30 bg-gradient-to-b from-slate-900/80 to-black/80 px-4 py-4 shadow-md" : "relative z-10 border-b border-cyan-500/30 bg-gradient-to-b from-slate-900/80 to-black/80 px-6 py-6 shadow-md"}>
      <div className={isCompactMode ? "mb-1.5 flex items-center justify-between gap-2" : "mb-2 flex items-center justify-between gap-2"}>
        <div className={isCompactMode ? "flex items-center space-x-2.5" : "flex items-center space-x-3"}>
          <div className="h-2 w-2 animate-pulse rounded-sm bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.9)]" />
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-400 drop-shadow-[0_2px_2px_rgba(0,0,0,1)]">
            Acto {briefing.chapter}
          </span>
        </div>
        <button type="button" aria-label="Salir al hub" onClick={onExitToHub} className="rounded border border-rose-400/70 bg-rose-950/45 px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-rose-100 shadow-[0_0_16px_rgba(244,63,94,0.25)] hover:border-rose-300 hover:bg-rose-900/55">
          Exit
        </button>
      </div>
      <h2 className={isCompactMode ? "text-xl font-black uppercase tracking-[0.09em] text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.4)]" : "text-2xl font-black uppercase tracking-[0.1em] text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.4)]"}>
        {briefing.arcTitle}
      </h2>
      <div className={isCompactMode ? "relative mt-3 border border-cyan-500/40 bg-gradient-to-r from-cyan-950/80 to-slate-950/80 p-3 shadow-inner" : "relative mt-5 border border-cyan-500/40 bg-gradient-to-r from-cyan-950/80 to-slate-950/80 p-4 shadow-inner"}>
        <div className="absolute left-0 top-0 h-full w-[3px] bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,0.8)]" />
        <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-cyan-300">
          <span className="inline-block border border-cyan-400/50 p-0.5">SYS</span>
          Directiva Primaria
        </p>
        <p className={isCompactMode ? "mt-1.5 text-xs font-medium leading-relaxed text-cyan-50 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" : "mt-2 text-sm font-medium leading-relaxed text-cyan-50 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]"}>
          {briefing.objective}
        </p>
      </div>
    </div>
  );
}
