// src/components/hub/story/internal/StorySidebar.tsx - Panel lateral Story con briefing y acciones de nodo sin recarga completa.
"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { IStoryChapterBriefing } from "@/services/story/build-story-chapter-briefing";
import { IStoryMapNodeRuntime } from "@/services/story/story-map-runtime-data";

interface StorySidebarProps {
  briefing: IStoryChapterBriefing;
  selectedNode: IStoryMapNodeRuntime | null;
  canMove: boolean;
  isMoving: boolean;
  movementError: string | null;
  onMove: () => void;
  onDeselect: () => void;
}

export function StorySidebar({
  briefing,
  selectedNode,
  canMove,
  isMoving,
  movementError,
  onMove,
  onDeselect,
}: StorySidebarProps) {
  const router = useRouter();
  return (
    <aside className="relative flex h-full w-full flex-col overflow-x-hidden overflow-y-auto bg-slate-950/90 backdrop-blur-xl">
      <div className="pointer-events-none absolute inset-0 z-0 bg-[linear-gradient(transparent_50%,rgba(6,182,212,0.03)_50%)] bg-[length:100%_4px]" />

      <div className="relative z-10 border-b border-cyan-500/20 bg-slate-900/50 p-6">
        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-400">Acto {briefing.chapter}</span>
        <h2 className="mt-1 text-2xl font-black uppercase tracking-widest text-fuchsia-100">{briefing.arcTitle}</h2>
        <div className="mt-4 rounded border border-slate-800 bg-black/60 p-3">
          <p className="text-xs font-medium leading-relaxed text-slate-300">
            <span className="mr-2 font-bold text-cyan-400">{">"} DIRECTIVA:</span>
            {briefing.objective}
          </p>
        </div>
      </div>

      <div className="relative z-10 flex flex-1 flex-col p-6">
        <AnimatePresence mode="wait">
          {selectedNode ? (
            <motion.div
              key={selectedNode.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex h-full flex-col"
            >
              <div className="mb-6 flex items-start justify-between">
                <span className="rounded border border-cyan-500/50 bg-cyan-950 px-2 py-1 text-[10px] font-black tracking-widest text-cyan-400">
                  {selectedNode.nodeType}
                </span>
                <button type="button" onClick={onDeselect} className="text-slate-500 hover:text-cyan-400" aria-label="Limpiar selección">
                  ✕
                </button>
              </div>

              <h3 className="mb-1 text-xl font-bold uppercase tracking-widest text-white">{selectedNode.title}</h3>
              <p className="mb-6 text-sm font-mono text-fuchsia-400">OPONENTE: {selectedNode.opponentName}</p>

              <div className="mb-auto space-y-3">
                <div className="flex items-center justify-between rounded border border-slate-700 bg-slate-900/80 p-3">
                  <span className="text-xs text-slate-400">DIFICULTAD</span>
                  <span className="text-xs font-bold text-amber-400">{selectedNode.difficulty}</span>
                </div>
                <div className="flex items-center justify-between rounded border border-slate-700 bg-slate-900/80 p-3">
                  <span className="text-xs text-slate-400">RECOMPENSA</span>
                  <span className="text-xs font-bold text-emerald-400">{selectedNode.rewardNexus} NEXUS</span>
                </div>
              </div>

              <div className="mt-6 space-y-2">
                <button
                  type="button"
                  onClick={onMove}
                  disabled={!canMove || isMoving}
                  className="w-full rounded border border-cyan-500/50 bg-cyan-950/60 py-3 text-xs font-black tracking-widest text-cyan-100 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {isMoving ? "MOVIENDO..." : "MOVERSE A NODO"}
                </button>
                <button
                  type="button"
                  onClick={() => router.push(selectedNode.href)}
                  disabled={!selectedNode.isUnlocked}
                  className={cn(
                    "w-full rounded py-4 font-black tracking-widest transition-all active:scale-95",
                    selectedNode.nodeType === "BOSS"
                      ? "bg-fuchsia-700 text-white shadow-[0_0_20px_rgba(192,38,211,0.4)] hover:bg-fuchsia-600"
                      : "bg-cyan-600 text-white shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:bg-cyan-500",
                    !selectedNode.isUnlocked && "cursor-not-allowed opacity-45",
                  )}
                >
                  {selectedNode.nodeType === "EVENT" ? "INICIAR INTERACCIÓN" : "HACKEAR NODO"}
                </button>
                {movementError ? <p className="text-xs text-rose-300">{movementError}</p> : null}
              </div>
            </motion.div>
          ) : (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-1 items-center justify-center text-center">
              <p className="animate-pulse font-mono text-sm text-slate-600">SELECCIONA UN NODO{"\n"}PARA VER DATOS TÁCTICOS</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </aside>
  );
}
