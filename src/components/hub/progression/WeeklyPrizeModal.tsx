// src/components/hub/progression/WeeklyPrizeModal.tsx - Anuncia el premio del ranking semanal ya cobrado.
// Es INFORMATIVO: los Nexus los acreditó el cierre semanal, aquí no se otorga nada (por eso no hay botón de
// "reclamar": si lo hubiera, se podría cobrar varias veces recargando).
"use client";

import { motion } from "framer-motion";
import { Activity, ShoppingBag } from "lucide-react";
import { IPendingWeeklyPrize } from "@/services/ranking/get-pending-weekly-prizes";

interface IWeeklyPrizeModalProps {
  prizes: IPendingWeeklyPrize[];
  onClose: () => void;
}

const BOARD_LABEL: Record<IPendingWeeklyPrize["board"], { label: string; icon: typeof Activity; accent: string; border: string }> = {
  ACTIVITY: { label: "Actividad", icon: Activity, accent: "text-cyan-300", border: "border-cyan-500/40" },
  COMMERCIAL: { label: "Comercio", icon: ShoppingBag, accent: "text-amber-300", border: "border-amber-500/40" },
};

function rankLabel(rank: number): string {
  if (rank === 1) return "1.º";
  if (rank === 2) return "2.º";
  if (rank === 3) return "3.º";
  return `${rank}.º`;
}

export function WeeklyPrizeModal({ prizes, onClose }: IWeeklyPrizeModalProps) {
  const totalNexus = prizes.reduce((sum, prize) => sum + prize.awardedNexus, 0);
  const bestRank = Math.min(...prizes.map((prize) => prize.finalRank));

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-label="Premio del ranking semanal"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.85, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 24 }}
        style={{ willChange: "transform" }}
        onClick={(event) => event.stopPropagation()}
        className="relative max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-2xl border border-amber-600/50 bg-gradient-to-b from-[#1a1206] to-[#0a0703] px-5 pb-5 pt-6 shadow-[0_0_60px_rgba(0,0,0,0.7)]"
      >
        <span className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
        <button
          type="button"
          aria-label="Cerrar"
          onClick={onClose}
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-lg border border-slate-600/70 text-slate-300 transition-colors hover:border-amber-400 hover:text-amber-200"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>

        <h2 className="text-center font-display text-xl font-bold uppercase tracking-[0.22em] text-amber-100">
          {bestRank === 1 ? "¡Ganaste el ranking!" : "Premio del ranking"}
        </h2>
        <p className="mt-1 text-center font-mono text-[10px] uppercase tracking-widest text-amber-500/70">
          Semana cerrada · Nexus ya ingresados
        </p>

        <div className="relative my-5 flex flex-col items-center">
          <motion.div
            aria-hidden
            className="pointer-events-none absolute h-56 w-56 rounded-full blur-2xl"
            style={{ background: "radial-gradient(circle,rgba(251,191,36,0.4),rgba(245,158,11,0.18),transparent 70%)" }}
            initial={{ opacity: 0.5, scale: 0.9 }}
            animate={{ opacity: [0.5, 0.85, 0.5], scale: [0.9, 1.05, 0.9] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
          />
          <span className="relative font-display text-6xl font-black text-amber-200 drop-shadow-[0_0_24px_rgba(251,191,36,0.7)]">
            +{totalNexus}
          </span>
          <span className="relative mt-1 font-display text-sm font-bold uppercase tracking-[0.3em] text-amber-300/80">Nexus</span>
        </div>

        <ul className="flex flex-col gap-2">
          {prizes.map((prize) => {
            const board = BOARD_LABEL[prize.board];
            const Icon = board.icon;
            return (
              <li key={prize.id} className={`flex items-center gap-3 rounded-lg border ${board.border} bg-black/30 px-3 py-2.5`}>
                <Icon className={`h-5 w-5 shrink-0 ${board.accent}`} aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className={`font-display text-sm font-bold uppercase tracking-[0.1em] ${board.accent}`}>
                    {rankLabel(prize.finalRank)} · {board.label}
                  </p>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-slate-400">
                    {prize.points} pts · Semana {prize.weekKey}
                  </p>
                </div>
                <span className="shrink-0 font-display text-base font-black text-amber-200">+{prize.awardedNexus}</span>
              </li>
            );
          })}
        </ul>

        <button
          type="button"
          className="mt-5 h-12 w-full rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 font-display text-sm font-bold uppercase tracking-[0.14em] text-slate-950 shadow-[0_0_24px_rgba(251,191,36,0.45)] transition hover:from-amber-400 hover:to-yellow-300"
          onClick={onClose}
        >
          Continuar
        </button>
      </motion.div>
    </div>
  );
}
