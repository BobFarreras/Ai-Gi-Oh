// src/components/game/board/ui/internal/duel-result/DuelResultRewardsPanel.tsx
"use client";

import { motion } from "framer-motion";
import { Zap, Hexagon, Gift } from "lucide-react";
import { IDuelResultRewardSummary } from "./duel-result-reward-summary";

interface DuelResultRewardsPanelProps {
  rewardSummary: IDuelResultRewardSummary;
  isGiftOpen: boolean;
  onToggleGift: () => void;
}

export function DuelResultRewardsPanel({ rewardSummary, isGiftOpen, onToggleGift }: DuelResultRewardsPanelProps) {
  const hasGift = rewardSummary.rewardCards.length > 0;

  return (
    <section className="flex flex-col gap-4 h-full">
      {/* TARJETA DE EXPERIENCIA DE JUGADOR */}
      <div className="relative overflow-hidden rounded-xl border border-cyan-500/30 bg-gradient-to-br from-cyan-950/60 to-black/80 p-5 shadow-[inset_0_0_20px_rgba(34,211,238,0.1)]">
        <Zap className="absolute -right-6 -top-2 w-28 h-28 text-cyan-500/10 -rotate-12 pointer-events-none" />
        <div className="relative z-10">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-400 mb-1">EXP Jugador</p>
          <p className="text-5xl font-black italic tracking-tighter text-white drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]">
            +{rewardSummary.rewardPlayerExperience}
          </p>
        </div>
      </div>

      {/* TARJETA DE NEXUS (MONEDAS) */}
      <div className="relative overflow-hidden rounded-xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/60 to-black/80 p-5 shadow-[inset_0_0_20px_rgba(16,185,129,0.1)]">
        <Hexagon className="absolute -right-6 -top-2 w-28 h-28 text-emerald-500/10 pointer-events-none" />
        <div className="relative z-10">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-400 mb-1">Nexus Coins</p>
          <p className="text-5xl font-black italic tracking-tighter text-white drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]">
            +{rewardSummary.rewardNexus}
          </p>
        </div>
      </div>

      {/* TARJETA DE REGALO / DROP */}
      <div className="relative flex-1 flex flex-col overflow-hidden rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-950/40 to-black/80 p-5">
        <Gift className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 text-amber-500/5 pointer-events-none" />
        
        <p className="relative z-10 text-xs font-black uppercase tracking-[0.2em] text-amber-400 mb-4">
          Drop Especial
        </p>
        
        <div className="relative z-10 flex-1 flex flex-col justify-center items-center">
          <motion.button
            aria-label="Mostrar carta recompensa"
            onClick={onToggleGift}
            disabled={!hasGift}
            whileHover={hasGift ? { scale: 1.05 } : {}}
            whileTap={hasGift ? { scale: 0.95 } : {}}
            animate={
              hasGift && !isGiftOpen
                ? { y: [0, -5, 0], filter: ["brightness(1)", "brightness(1.3)", "brightness(1)"] }
                : undefined
            }
            transition={hasGift ? { duration: 1.5, repeat: Infinity, ease: "easeInOut" } : undefined}
            className={`w-full h-16 flex items-center justify-center gap-3 rounded-lg border-2 font-black tracking-widest uppercase transition-all
              ${hasGift 
                ? "border-amber-400 bg-amber-500/20 text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:bg-amber-500/40 cursor-pointer" 
                : "border-zinc-800 bg-zinc-900/50 text-zinc-600 cursor-not-allowed"}`}
          >
            {hasGift ? (isGiftOpen ? "Ocultar Carta" : "Revelar Drop") : "Sin Drop"}
          </motion.button>
        </div>
      </div>
    </section>
  );
}
