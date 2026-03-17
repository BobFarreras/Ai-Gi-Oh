// src/components/hub/story/internal/scene/panels/internal/StorySidebarNodeContent.tsx - Contenido del nodo seleccionado y CTA del panel Story.
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { IStoryMapNodeRuntime } from "@/services/story/story-map-runtime-data";
import { IStorySidebarNodeViewModel } from "./story-sidebar-view-model";
import { storySidebarContainerVariants, storySidebarItemVariants } from "./story-sidebar-motion";

interface IStorySidebarNodeContentProps {
  selectedNode: IStoryMapNodeRuntime;
  viewModel: IStorySidebarNodeViewModel;
  isMoving: boolean;
  movementError: string | null;
  interactionFeedback: string | null;
  smartActionLabel: string;
  canRunSmartAction: boolean;
  isCompactMode: boolean;
  onSmartAction: () => void;
  onDeselect: () => void;
}

export function StorySidebarNodeContent(props: IStorySidebarNodeContentProps) {
  return (
    <motion.div key={props.selectedNode.id} variants={storySidebarContainerVariants} initial="hidden" animate="visible" exit="exit" className="flex h-full flex-col">
      <motion.div variants={storySidebarItemVariants} className={props.isCompactMode ? "mb-3 flex items-start justify-between" : "mb-4 flex items-start justify-between"}>
        <span className={cn("border px-2 py-1 text-[10px] font-black uppercase tracking-[0.2em] shadow-sm [clip-path:polygon(0_0,100%_0,100%_calc(100%-4px),calc(100%-4px)_100%,0_100%)]", props.viewModel.isBossNode ? "border-fuchsia-500/60 bg-fuchsia-950/50 text-fuchsia-300" : "border-cyan-500/60 bg-cyan-950/50 text-cyan-300")}>
          {props.selectedNode.nodeType}
        </span>
        <button type="button" onClick={props.onDeselect} className="group relative rounded px-2 py-1 text-xs text-slate-400 transition-colors hover:bg-cyan-500/10 hover:text-cyan-300" aria-label="Cerrar telemetría">
          <span className="font-mono">[\ESC]</span>
        </button>
      </motion.div>

      <motion.h3 variants={storySidebarItemVariants} className={props.isCompactMode ? "mb-1.5 text-lg font-black uppercase tracking-[0.07em] text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" : "mb-2 text-xl font-black uppercase tracking-[0.08em] text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"}>
        {props.viewModel.nodeTitle}
      </motion.h3>
      <motion.div variants={storySidebarItemVariants}>
        {props.viewModel.nodeOpponent ? (
          <p className={props.isCompactMode ? "mb-4 flex items-center text-xs font-bold uppercase tracking-[0.13em] text-fuchsia-300 drop-shadow-[0_0_8px_rgba(232,121,249,0.5)]" : "mb-6 flex items-center text-sm font-bold uppercase tracking-widest text-fuchsia-300 drop-shadow-[0_0_8px_rgba(232,121,249,0.5)]"}><span className="mr-2 animate-pulse">⚠️</span> HOSTIL: {props.viewModel.nodeOpponent}</p>
        ) : (
          <p className={props.isCompactMode ? "mb-4 flex items-center text-[11px] font-bold uppercase tracking-[0.15em] text-emerald-400" : "mb-6 flex items-center text-xs font-bold uppercase tracking-[0.2em] text-emerald-400"}><span className="mr-2">✓</span> Tránsito Seguro</p>
        )}
      </motion.div>

      <motion.div variants={storySidebarItemVariants} className={props.isCompactMode ? "mb-auto space-y-2.5 rounded-md border border-white/5 bg-black/40 p-3" : "mb-auto space-y-3 rounded-md border border-white/5 bg-black/40 p-4"}>
        <div className="flex items-center justify-between border-b border-white/10 pb-2">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Nivel de Amenaza</span>
          <span className={cn("rounded-sm px-2 py-0.5 text-[11px] font-black uppercase tracking-[0.2em]", props.viewModel.difficultyToneClassName)}>{props.viewModel.nodeDifficulty}</span>
        </div>
        <div className="flex items-center justify-between pt-1">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Recompensa Proyectada</span>
          <span className={props.isCompactMode ? "text-xs font-black uppercase tracking-[0.14em] text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]" : "text-sm font-black uppercase tracking-[0.15em] text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.4)]"}>+ {props.viewModel.nodeReward} NX</span>
        </div>
      </motion.div>

      <motion.div variants={storySidebarItemVariants} className={props.isCompactMode ? "mt-5 space-y-2.5" : "mt-8 space-y-3"}>
        <button type="button" onClick={props.onSmartAction} disabled={!props.canRunSmartAction || props.isMoving} className={cn(props.isCompactMode ? "relative w-full overflow-hidden px-3 py-3 text-xs font-black uppercase tracking-[0.16em] transition-all active:scale-[0.98] before:absolute before:inset-0 before:-z-10 before:bg-gradient-to-r [clip-path:polygon(0_0,100%_0,100%_calc(100%-10px),calc(100%-10px)_100%,0_100%)]" : "relative w-full overflow-hidden px-4 py-4 text-sm font-black uppercase tracking-[0.2em] transition-all active:scale-[0.98] before:absolute before:inset-0 before:-z-10 before:bg-gradient-to-r [clip-path:polygon(0_0,100%_0,100%_calc(100%-12px),calc(100%-12px)_100%,0_100%)]", props.selectedNode.nodeType === "BOSS" ? "border-l-2 border-t-2 border-fuchsia-400 text-white before:from-fuchsia-600/60 before:to-fuchsia-900/60 hover:before:from-fuchsia-500/80 hover:shadow-[0_0_30px_rgba(217,70,239,0.6)]" : "border-l-2 border-t-2 border-cyan-400 text-white before:from-cyan-600/60 before:to-cyan-900/60 hover:before:from-cyan-500/80 hover:shadow-[0_0_30px_rgba(34,211,238,0.6)]", (!props.canRunSmartAction || props.isMoving) && "cursor-not-allowed grayscale opacity-60 hover:shadow-none")}>
          <span className="relative z-10 flex items-center justify-center gap-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            {props.isMoving ? <><span className="h-2 w-2 animate-ping rounded-full bg-white" />Ejecutando...</> : <><span className="mr-1 font-mono text-lg leading-none">»</span>{props.smartActionLabel}</>}
          </span>
        </button>
        <AnimatePresence>
          {props.movementError ? <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="border-l-2 border-rose-500 bg-rose-950/80 px-3 py-2 text-xs font-mono text-rose-200 shadow-inner">ERR: {props.movementError}</motion.p> : null}
          {props.interactionFeedback ? <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="border-l-2 border-emerald-500 bg-emerald-950/80 px-3 py-2 text-xs font-mono text-emerald-200 shadow-inner">SYS: {props.interactionFeedback}</motion.p> : null}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
