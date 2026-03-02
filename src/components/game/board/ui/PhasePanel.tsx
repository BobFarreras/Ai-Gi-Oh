"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, Swords } from "lucide-react";
import { TurnPhase } from "@/core/use-cases/game-engine/types";

const PHASE_DESCRIPTIONS: Record<TurnPhase, string> = {
  MAIN_1: "FASE DE PREPARACIÓN (Invoca o Coloca Entidades)",
  BATTLE: "FASE DE COMBATE (Selecciona atacante)",
};

interface PhasePanelProps {
  phase: TurnPhase;
  hasNormalSummonedThisTurn: boolean;
  isPlayerTurn: boolean;
  onAdvancePhase: () => void;
}

export function PhasePanel({ phase, hasNormalSummonedThisTurn, isPlayerTurn, onAdvancePhase }: PhasePanelProps) {
  return (
    <div className="w-full bg-cyan-950/90 border-x-2 border-b-2 border-cyan-800 px-4 py-3 rounded-b-2xl shadow-lg flex flex-col items-center gap-3">
      <span className="text-[10px] font-black text-cyan-100 tracking-[0.1em] text-center opacity-80 uppercase">
        {PHASE_DESCRIPTIONS[phase]}
      </span>

      <div className="flex w-full gap-2 h-8 relative">
        {!isPlayerTurn && (
          <div className="w-full flex items-center justify-center text-[10px] uppercase tracking-widest text-zinc-400 font-black bg-zinc-900/70 rounded">
            Turno Rival
          </div>
        )}
        <AnimatePresence>
          {isPlayerTurn && phase === "MAIN_1" && hasNormalSummonedThisTurn && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute inset-0 flex gap-2"
            >
              <button
                onClick={onAdvancePhase}
                className="w-full flex items-center justify-center gap-1 bg-red-900 hover:bg-red-700 text-red-100 py-1 rounded uppercase font-black text-[10px] tracking-widest border border-red-500 transition-all shadow-[0_0_15px_rgba(239,68,68,0.8)] animate-pulse"
              >
                <Swords size={12} /> Ir a Combate
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {isPlayerTurn && (!hasNormalSummonedThisTurn || phase !== "MAIN_1") && (
          <button
            onClick={onAdvancePhase}
            className="w-full flex items-center justify-center gap-1 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white py-1 rounded uppercase font-black text-[10px] tracking-widest transition-all"
          >
            {phase === "MAIN_1" ? "Ir a Combate" : "Pasar Turno"} <ChevronRight size={14} />
          </button>
        )}
      </div>
    </div>
  );
}
