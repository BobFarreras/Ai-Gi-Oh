// src/components/game/board/internal/HudPhaseControls.tsx
"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Shield, SkipForward, Swords, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface HudPhaseControlsProps {
  phase: string;
  isVisible: boolean;
  onAdvancePhase?: () => void;
}

export function HudPhaseControls({ phase, isVisible, onAdvancePhase }: HudPhaseControlsProps) {
  if (!isVisible) return null;
  const normalizedPhase = phase.toUpperCase();
  const isMainPhase = normalizedPhase.includes("MAIN");
  const isBattlePhase = normalizedPhase.includes("BATTLE");
  const isEndTurnEnabled = isBattlePhase && Boolean(onAdvancePhase);

  return (
    // ADAPTATIVO: w-full hereda los 420px del PlayerHUD. left-0 lo ancla perfectamente al borde.
    <div className="absolute -top-[52px] left-0 w-full pl-6 pr-4 flex flex-row items-end justify-between gap-1 sm:gap-1.5 pointer-events-auto z-[120]">
      
      {/* EFECTO DE TRANSICIÓN: Flash cibernético al cambiar de fase */}
      <AnimatePresence mode="popLayout">
        <motion.div
          key={phase}
          initial={{ opacity: 0.8, x: -100, skewX: -15 }}
          animate={{ opacity: 0, x: 400, skewX: -15 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="absolute inset-0 z-50 w-32 bg-white mix-blend-overlay pointer-events-none shadow-[0_0_20px_rgba(255,255,255,0.8)]"
        />
      </AnimatePresence>

      {/* 1. INDICADOR: INVOCAR */}
      {/* flex-1: Se expande u encoge según el espacio disponible sin romper el diseño */}
      <motion.button
        disabled
        layout
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1, height: isMainPhase ? 48 : 40 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className={cn(
          "relative group flex-1 flex flex-col items-center justify-center transform skew-x-[-12deg] border-b-[3px]",
          isMainPhase 
            ? "bg-cyan-950/90 border-cyan-400 shadow-[0_5px_15px_rgba(34,211,238,0.4)] opacity-100 z-10" 
            : "bg-zinc-950/60 border-zinc-800 opacity-50 grayscale z-0"
        )}
      >
        <div className="flex flex-col items-center transform skew-x-[12deg] relative z-10 w-full">
          {isMainPhase && <span className="text-[8px] text-cyan-300 font-black tracking-widest leading-none mb-0.5 animate-pulse">ACTUAL</span>}
          <div className="flex items-center justify-center gap-1 sm:gap-1.5">
            <Shield className={cn("w-3.5 h-3.5 sm:w-4 sm:h-4", isMainPhase ? "text-cyan-300 drop-shadow-md" : "text-zinc-500")} />
            <span className={cn("font-black tracking-widest text-[10px] sm:text-xs uppercase truncate", isMainPhase ? "text-cyan-100 drop-shadow-[0_0_5px_rgba(34,211,238,0.8)]" : "text-zinc-500")}>
              Invocar
            </span>
          </div>
        </div>
      </motion.button>

      {/* FLECHA 1 */}
      <motion.div layout className="flex items-center justify-center h-10 px-0.5 flex-shrink-0">
        <ChevronRight className={cn("w-3.5 h-3.5 sm:w-4 sm:h-4", isMainPhase ? "text-amber-500/80 animate-pulse" : "text-zinc-700/50")} />
      </motion.div>

      {/* 2. BOTÓN: COMBATE */}
      <motion.button
        layout
        disabled={!isMainPhase || !onAdvancePhase}
        onClick={() => onAdvancePhase?.()}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1, height: isBattlePhase ? 48 : 40 }}
        whileHover={{ scale: isMainPhase ? 1.05 : 1, y: isMainPhase ? -2 : 0 }}
        whileTap={{ scale: isMainPhase ? 0.95 : 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className={cn(
          "relative group flex-1 flex flex-col items-center justify-center transform skew-x-[-12deg] border-b-[3px]",
          isBattlePhase 
            ? "bg-amber-950/90 border-amber-500 shadow-[0_5px_20px_rgba(245,158,11,0.5)] opacity-100 z-10" 
            : isMainPhase 
              ? "bg-zinc-950/80 border-amber-500/50 hover:bg-amber-950/60 hover:border-amber-400 cursor-pointer shadow-[0_0_15px_rgba(245,158,11,0.2)] z-0" 
              : "bg-zinc-950/60 border-zinc-800 opacity-50 grayscale cursor-not-allowed z-0"
        )}
      >
        {isMainPhase && <div className="absolute inset-0 bg-amber-500/10 animate-pulse pointer-events-none" />}
        <div className="flex flex-col items-center transform skew-x-[12deg] relative z-10 w-full">
          {isBattlePhase && <span className="text-[8px] text-amber-300 font-black tracking-widest leading-none mb-0.5 animate-pulse">ACTUAL</span>}
          {isMainPhase && <span className="text-[8px] text-amber-500/80 font-black tracking-widest leading-none mb-0.5 group-hover:text-amber-400 transition-colors">SIGUIENTE</span>}
          <div className="flex items-center justify-center gap-1 sm:gap-1.5">
            <Swords className={cn("w-3.5 h-3.5 sm:w-4 sm:h-4", isBattlePhase || isMainPhase ? "text-amber-400" : "text-zinc-500")} />
            <span className={cn("font-black tracking-widest text-[10px] sm:text-xs uppercase transition-colors truncate", isBattlePhase ? "text-amber-100" : isMainPhase ? "text-amber-200/80 group-hover:text-amber-100" : "text-zinc-500")}>
              Combate
            </span>
          </div>
        </div>
      </motion.button>

      {/* FLECHA 2 */}
      <motion.div layout className="flex items-center justify-center h-10 px-0.5 flex-shrink-0">
        <ChevronRight className={cn("w-3.5 h-3.5 sm:w-4 sm:h-4", isBattlePhase ? "text-fuchsia-500/80 animate-pulse" : "text-zinc-700/50")} />
      </motion.div>

      {/* 3. BOTÓN: PASAR TURNO */}
      <motion.button
        layout
        disabled={!isEndTurnEnabled}
        onClick={() => onAdvancePhase?.()}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1, height: 40 }}
        whileHover={{ scale: isEndTurnEnabled ? 1.05 : 1, y: isEndTurnEnabled ? -2 : 0 }}
        whileTap={{ scale: isEndTurnEnabled ? 0.95 : 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className={cn(
          "relative group flex-1 flex flex-col items-center justify-center transform skew-x-[-12deg] border-b-[3px]",
          isEndTurnEnabled 
            ? "bg-zinc-950/80 border-fuchsia-500/60 hover:bg-fuchsia-950/60 hover:border-fuchsia-400 cursor-pointer shadow-[0_0_15px_rgba(217,70,239,0.3)] z-0" 
            : "bg-zinc-950/60 border-zinc-800 opacity-50 grayscale cursor-not-allowed z-0"
        )}
      >
        {isEndTurnEnabled && <div className="absolute inset-0 bg-fuchsia-500/10 animate-pulse pointer-events-none" />}
        <div className="flex flex-col items-center transform skew-x-[12deg] relative z-10 w-full">
          {isEndTurnEnabled && <span className="text-[8px] text-fuchsia-500/80 font-black tracking-widest leading-none mb-0.5 group-hover:text-fuchsia-400 transition-colors">SIGUIENTE</span>}
          <div className="flex items-center justify-center gap-1 sm:gap-1.5">
            <SkipForward className={cn("w-3.5 h-3.5 sm:w-4 sm:h-4", isEndTurnEnabled ? "text-fuchsia-400" : "text-zinc-500")} />
            <span className={cn("font-black tracking-widest text-[10px] sm:text-xs uppercase transition-colors truncate", isEndTurnEnabled ? "text-fuchsia-200/90 group-hover:text-fuchsia-100" : "text-zinc-500")}>
              Pasar
            </span>
          </div>
        </div>
      </motion.button>

    </div>
  );
}