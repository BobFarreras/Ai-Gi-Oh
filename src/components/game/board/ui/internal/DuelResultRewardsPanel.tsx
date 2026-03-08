// src/components/game/board/ui/internal/DuelResultRewardsPanel.tsx - Sidebar compacto de recompensas del jugador con acceso rápido al regalo.
"use client";

import { motion } from "framer-motion";
import { IDuelResultRewardSummary } from "./duel-result-reward-summary";

interface DuelResultRewardsPanelProps {
  rewardSummary: IDuelResultRewardSummary;
  isGiftOpen: boolean;
  onToggleGift: () => void;
}

export function DuelResultRewardsPanel({ rewardSummary, isGiftOpen, onToggleGift }: DuelResultRewardsPanelProps) {
  const hasGift = rewardSummary.rewardCards.length > 0;

  return (
    <section className="rounded-2xl border border-cyan-300/35 bg-cyan-950/25 p-3 text-left lg:h-full">
      <p className="mb-3 text-[10px] font-black uppercase tracking-[0.22em] text-cyan-200/90">Recompensas</p>
      <div className="space-y-2">
        <div className="rounded-lg border border-cyan-300/35 bg-black/40 px-3 py-2">
          <p className="text-[9px] font-black uppercase tracking-[0.16em] text-cyan-200/80">EXP</p>
          <p className="text-xl font-black text-cyan-100">+{rewardSummary.rewardPlayerExperience}</p>
        </div>
        <div className="rounded-lg border border-emerald-300/35 bg-black/40 px-3 py-2">
          <p className="text-[9px] font-black uppercase tracking-[0.16em] text-emerald-200/80">Nexus</p>
          <p className="text-xl font-black text-emerald-100">+{rewardSummary.rewardNexus}</p>
        </div>
      </div>
      <div className="mt-3 rounded-lg border border-amber-300/40 bg-black/40 p-2">
        <p className="text-[9px] font-black uppercase tracking-[0.16em] text-amber-200/80">Regalo</p>
        <motion.button
          aria-label="Mostrar carta recompensa"
          onClick={onToggleGift}
          animate={
            hasGift
              ? { y: [0, -1.5, 0], boxShadow: ["0 0 0 rgba(251,191,36,0)", "0 0 16px rgba(251,191,36,0.65)", "0 0 0 rgba(251,191,36,0)"] }
              : undefined
          }
          transition={hasGift ? { duration: 0.85, repeat: Infinity, ease: "easeInOut" } : undefined}
          className="mt-1 flex h-10 w-full items-center justify-center rounded-md border border-amber-300/60 bg-amber-500/15 text-lg hover:bg-amber-500/25"
        >
          {hasGift ? "🎁" : "—"}
        </motion.button>
        {hasGift ? (
          <p className="mt-1 text-[10px] font-semibold text-amber-100">{isGiftOpen ? "Ocultar carta" : "Ver carta"}</p>
        ) : (
          <p className="mt-1 text-[10px] font-semibold text-zinc-300">Sin drop</p>
        )}
      </div>
    </section>
  );
}
