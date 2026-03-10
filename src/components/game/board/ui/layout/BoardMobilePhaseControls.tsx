// src/components/game/board/ui/layout/BoardMobilePhaseControls.tsx - Dock móvil de fases junto al HUD del jugador con acciones de avance de turno.
"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { Shield, SkipForward, Swords } from "lucide-react";
import { cn } from "@/lib/utils";
import { useBoardPerformanceProfile } from "@/components/game/board/internal/use-board-performance-profile";

interface BoardMobilePhaseControlsProps {
  phase: string;
  isPlayerTurn: boolean;
  hasWinner: boolean;
  onAdvancePhase: () => void;
}

export function BoardMobilePhaseControls({ phase, isPlayerTurn, hasWinner, onAdvancePhase }: BoardMobilePhaseControlsProps) {
  const normalized = phase.toUpperCase();
  const isMain = normalized.includes("MAIN");
  const isBattle = normalized.includes("BATTLE");
  const canAdvance = isPlayerTurn && !hasWinner;
  const [viewportWidth, setViewportWidth] = useState(390);
  useEffect(() => {
    const sync = () => setViewportWidth(window.innerWidth);
    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, []);
  const sizing = useMemo(() => {
    const freeWidth = Math.max(0, viewportWidth - 300);
    const grow = Math.min(1, freeWidth / 120);
    return {
      height: 32 + Math.round(grow * 8),
      compactWidth: 36 + Math.round(grow * 8),
      activeWidth: 70 + Math.round(grow * 24),
      fontSize: 8 + Math.round(grow * 1),
    };
  }, [viewportWidth]);
  const invocarWidth = isMain ? sizing.activeWidth : sizing.compactWidth;
  const combateWidth = isBattle ? sizing.activeWidth : sizing.compactWidth;
  const pasarWidth = !isMain && !isBattle ? sizing.activeWidth : sizing.compactWidth;
  const currentPhaseKey = isMain ? "INVOCAR" : isBattle ? "COMBATE" : "PASAR";
  const buttonClass =
    "relative flex items-center justify-center border-b-[2px] px-1 font-black uppercase tracking-wider [clip-path:polygon(6%_0,100%_0,94%_100%,0_100%)]";
  const { shouldReduceCombatEffects } = useBoardPerformanceProfile();

  if (shouldReduceCombatEffects) {
    return (
      <div className="absolute bottom-2 left-[calc(clamp(11.8rem,36vw,16.8rem)-0.05rem)] z-[290] flex items-center gap-1 pointer-events-auto">
        <button
          aria-label="Fase invocar"
          disabled
          className={cn(buttonClass, isMain ? "border-cyan-400/80 bg-cyan-950/70 text-cyan-200" : "border-zinc-700/80 bg-zinc-900/70 text-zinc-500")}
          style={{ height: `${sizing.height}px`, width: `${invocarWidth}px`, fontSize: `${sizing.fontSize}px` }}
        >
          <span className="flex items-center justify-center gap-1"><Shield size={12} />{isMain && <span>Invocar</span>}</span>
        </button>
        <button
          aria-label="Pasar a combate"
          disabled={!canAdvance || !isMain}
          onClick={onAdvancePhase}
          className={cn(buttonClass, isBattle ? "border-amber-400/80 bg-amber-950/70 text-amber-200" : canAdvance && isMain ? "border-amber-500/60 bg-zinc-900/80 text-amber-300" : "border-zinc-700/80 bg-zinc-900/70 text-zinc-500")}
          style={{ height: `${sizing.height}px`, width: `${combateWidth}px`, fontSize: `${sizing.fontSize}px` }}
        >
          <span className="flex items-center justify-center gap-1"><Swords size={12} />{isBattle && <span>Combate</span>}</span>
        </button>
        <button
          aria-label="Pasar turno"
          disabled={!canAdvance || !isBattle}
          onClick={onAdvancePhase}
          className={cn(buttonClass, canAdvance && isBattle ? "border-fuchsia-500/65 bg-zinc-900/80 text-fuchsia-300" : "border-zinc-700/80 bg-zinc-900/70 text-zinc-500")}
          style={{ height: `${sizing.height}px`, width: `${pasarWidth}px`, fontSize: `${sizing.fontSize}px` }}
        >
          <span className="flex items-center justify-center gap-1"><SkipForward size={12} />{!isMain && !isBattle && <span>Pasar</span>}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="absolute bottom-2 left-[calc(clamp(11.8rem,36vw,16.8rem)-0.05rem)] z-[290] flex items-center gap-1 pointer-events-auto">
      <AnimatePresence mode="popLayout">
        <motion.div
          key={currentPhaseKey}
          initial={{ opacity: 0.75, x: -26, skewX: -14 }}
          animate={{ opacity: 0, x: 132, skewX: -14 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="pointer-events-none absolute inset-y-0 left-0 z-[310] w-8 bg-white/70 mix-blend-overlay"
        />
      </AnimatePresence>
      <motion.button
        aria-label="Fase invocar"
        disabled
        className={cn(
          buttonClass,
          isMain ? "border-cyan-400/80 bg-cyan-950/70 text-cyan-200 shadow-[0_0_14px_rgba(34,211,238,0.25)]" : "border-zinc-700/80 bg-zinc-900/70 text-zinc-500",
        )}
        style={{ height: `${sizing.height}px`, width: `${invocarWidth}px`, fontSize: `${sizing.fontSize}px` }}
        animate={{ scale: isMain ? 1.03 : 1 }}
        transition={{ type: "spring", stiffness: 280, damping: 22 }}
      >
        <span className="flex items-center justify-center gap-1">
          <Shield size={12} />
          {isMain && <span>Invocar</span>}
        </span>
      </motion.button>
      <motion.button
        aria-label="Pasar a combate"
        disabled={!canAdvance || !isMain}
        onClick={onAdvancePhase}
        className={cn(
          buttonClass,
          isBattle
            ? "border-amber-400/80 bg-amber-950/70 text-amber-200 shadow-[0_0_14px_rgba(251,191,36,0.25)]"
            : canAdvance && isMain
              ? "border-amber-500/60 bg-zinc-900/80 text-amber-300"
              : "border-zinc-700/80 bg-zinc-900/70 text-zinc-500",
        )}
        style={{ height: `${sizing.height}px`, width: `${combateWidth}px`, fontSize: `${sizing.fontSize}px` }}
        animate={{ scale: isBattle ? 1.03 : 1 }}
        transition={{ type: "spring", stiffness: 280, damping: 22 }}
      >
        <span className="flex items-center justify-center gap-1">
          <Swords size={12} />
          {isBattle && <span>Combate</span>}
        </span>
      </motion.button>
      <motion.button
        aria-label="Pasar turno"
        disabled={!canAdvance || !isBattle}
        onClick={onAdvancePhase}
        className={cn(
          buttonClass,
          canAdvance && isBattle ? "border-fuchsia-500/65 bg-zinc-900/80 text-fuchsia-300 shadow-[0_0_14px_rgba(217,70,239,0.22)]" : "border-zinc-700/80 bg-zinc-900/70 text-zinc-500",
        )}
        style={{ height: `${sizing.height}px`, width: `${pasarWidth}px`, fontSize: `${sizing.fontSize}px` }}
        animate={{ scale: !isMain && !isBattle ? 1.03 : 1 }}
        transition={{ type: "spring", stiffness: 280, damping: 22 }}
      >
        <span className="flex items-center justify-center gap-1">
          <SkipForward size={12} />
          {!isMain && !isBattle && <span>Pasar</span>}
        </span>
      </motion.button>
    </div>
  );
}
