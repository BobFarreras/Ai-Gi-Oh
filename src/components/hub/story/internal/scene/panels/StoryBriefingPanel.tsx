// src/components/hub/story/internal/scene/panels/StoryBriefingPanel.tsx - Resumen narrativo del acto con objetivo activo.
"use client";

import { motion } from "framer-motion";
import { IStoryChapterBriefing } from "@/services/story/build-story-chapter-briefing";
import { cn } from "@/lib/utils";

interface StoryBriefingPanelProps {
  briefing: IStoryChapterBriefing;
  className?: string;
}

export function StoryBriefingPanel({ briefing, className }: StoryBriefingPanelProps) {
  return (
    <motion.aside
      initial={{ opacity: 0, x: -50, filter: "blur(10px)" }}
      animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className={cn(
        "relative flex w-[clamp(18rem,25vw,26rem)] flex-col gap-4 overflow-hidden rounded-xl border border-cyan-500/40 bg-slate-950/80 p-5 shadow-[0_0_30px_rgba(6,182,212,0.15)] backdrop-blur-md pointer-events-none",
        className
      )}
    >
      {/* Efecto Cyberpunk: Scanlines de fondo */}
      <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(6,182,212,0.03)_50%)] bg-[length:100%_4px] pointer-events-none z-0" />
      
      {/* Detalle visual: Línea de energía superior */}
      <motion.div 
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 0.3, duration: 0.8, ease: "easeOut" }}
        className="absolute left-0 top-0 h-[2px] w-[60%] origin-left bg-gradient-to-r from-cyan-400 to-transparent z-10" 
      />

      {/* Header del Briefing */}
      <header className="relative z-10 flex flex-col border-b border-cyan-500/20 pb-3">
        <motion.span 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-400"
        >
          Transmisión Interceptada
        </motion.span>
        <h2 className="mt-1 text-xl font-black uppercase tracking-widest text-fuchsia-100 text-shadow-glow">
          {briefing.arcTitle}
        </h2>
      </header>

      {/* Datos Tácticos */}
      <div className="relative z-10 flex flex-col gap-3">
        <div className="rounded-lg border border-slate-800/80 bg-slate-900/60 p-3 shadow-inner">
          <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-cyan-300">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
            Directiva Principal
          </span>
          <p className="mt-1.5 text-xs font-medium leading-relaxed text-slate-300">
            {briefing.objective}
          </p>
        </div>

        <div className="rounded-lg border border-fuchsia-900/50 bg-fuchsia-950/20 p-3 shadow-inner">
          <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-fuchsia-400">
            <span className="h-1.5 w-1.5 rounded-full bg-fuchsia-500" />
            Nivel de Amenaza
          </span>
          <p className="mt-1.5 text-xs font-medium leading-relaxed text-fuchsia-100/90">
            {briefing.tension}
          </p>
        </div>
      </div>
    </motion.aside>
  );
}
