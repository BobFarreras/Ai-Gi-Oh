// src/components/hub/ranking/RankingScoringHelpDialog.tsx - Hoja de ayuda contextual: explica de forma
// visual cómo se ganan puntos en el tablero activo y (si es semanal) sus premios EN VIVO desde la BD.
"use client";

import { motion } from "framer-motion";
import { CalendarClock, Coins, Trophy, X } from "lucide-react";
import { IRankingScoringGuide } from "@/services/ranking/ranking-scoring";
import { IRankingBoardPrize } from "@/services/ranking/get-ranking-boards";

interface RankingScoringHelpDialogProps {
  guide: IRankingScoringGuide;
  /** Premios en vivo del tablero (desde BD). Vacío en el tablero de ELO. */
  prizes?: IRankingBoardPrize[];
  onClose: () => void;
}

/** Estilo por posición del premio (oro / plata / bronce / resto). */
function prizeRankStyle(rank: number): { badge: string; medal: string } {
  if (rank === 1) return { badge: "border-amber-300/60 bg-amber-400/15 text-amber-200", medal: "🥇" };
  if (rank === 2) return { badge: "border-slate-300/50 bg-slate-300/10 text-slate-100", medal: "🥈" };
  if (rank === 3) return { badge: "border-orange-400/50 bg-orange-500/10 text-orange-200", medal: "🥉" };
  return { badge: "border-cyan-500/40 bg-cyan-500/5 text-cyan-200", medal: `#${rank}` };
}

const listStagger = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const itemFade = { hidden: { opacity: 0, x: -8 }, show: { opacity: 1, x: 0 } };

export function RankingScoringHelpDialog({ guide, prizes = [], onClose }: RankingScoringHelpDialogProps) {
  const sortedPrizes = [...prizes].sort((a, b) => a.rank - b.rank);
  const showPrizes = guide.weekly && sortedPrizes.length > 0;

  return (
    <motion.div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label={`Cómo puntúa ${guide.title}`}
        className="relative flex max-h-[88vh] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-cyan-400/40 bg-[#04121d]/95 shadow-[0_0_50px_rgba(34,211,238,0.18)]"
        initial={{ scale: 0.9, opacity: 0, y: 12 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: "spring", stiffness: 320, damping: 26 }}
        onClick={(event) => event.stopPropagation()}
      >
        {/* Cabecera con acento y degradado */}
        <header className="relative shrink-0 overflow-hidden border-b border-cyan-400/20 bg-gradient-to-br from-cyan-500/15 via-sky-500/5 to-transparent px-6 pb-4 pt-5">
          <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-cyan-400/10 blur-2xl" />
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar ayuda"
            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg border border-slate-600/70 text-slate-300 transition-colors hover:border-cyan-400/60 hover:text-cyan-100"
          >
            <X size={18} />
          </button>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-300/40 bg-cyan-400/10 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-[0.18em] text-cyan-200">
            <Trophy size={12} /> {guide.cadence}
          </span>
          <h3 className="mt-2 text-2xl font-black text-white">{guide.title}</h3>
          <p className="mt-1.5 text-[13.5px] leading-6 text-slate-300">{guide.summary}</p>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
          {/* Cómo sumas puntos */}
          <p className="mb-2.5 text-[11px] font-black uppercase tracking-[0.18em] text-cyan-400/80">Cómo sumas puntos</p>
          <motion.ul variants={listStagger} initial="hidden" animate="show" className="space-y-2">
            {guide.rules.map((rule) => (
              <motion.li
                key={rule.action}
                variants={itemFade}
                className="flex items-center justify-between gap-3 rounded-xl border border-slate-700/60 bg-slate-950/50 py-2 pl-3 pr-2"
              >
                <span className="flex items-center gap-2.5 text-[13.5px] text-slate-100">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]" />
                  {rule.action}
                </span>
                <span className="shrink-0 rounded-lg border border-cyan-400/40 bg-gradient-to-b from-cyan-400/20 to-cyan-500/5 px-2.5 py-1 text-sm font-black tabular-nums text-cyan-100">
                  {rule.points}
                </span>
              </motion.li>
            ))}
          </motion.ul>

          {/* Premios semanales EN VIVO (desde BD) */}
          {showPrizes ? (
            <div className="mt-5">
              <p className="mb-2.5 flex items-center gap-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-amber-300/80">
                <Coins size={13} /> Premios de la semana
              </p>
              <motion.ul variants={listStagger} initial="hidden" animate="show" className="space-y-1.5">
                {sortedPrizes.map((prize) => {
                  const style = prizeRankStyle(prize.rank);
                  return (
                    <motion.li
                      key={prize.rank}
                      variants={itemFade}
                      className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-1.5 ${style.badge}`}
                    >
                      <span className="flex items-center gap-2 text-sm font-black">
                        <span className="w-6 text-center text-base leading-none">{style.medal}</span>
                        <span className="text-[12px] font-bold uppercase tracking-wider opacity-80">Puesto {prize.rank}</span>
                      </span>
                      <span className="flex items-center gap-1 text-sm font-black tabular-nums">
                        {prize.rewardNexus.toLocaleString()} <span className="text-[11px] opacity-70">Nexus</span>
                      </span>
                    </motion.li>
                  );
                })}
              </motion.ul>
            </div>
          ) : null}

          {guide.resetNote ? (
            <p className="mt-4 flex items-center gap-1.5 text-[12px] leading-5 text-slate-400">
              <CalendarClock size={13} className="shrink-0 text-violet-300/80" /> {guide.resetNote}
            </p>
          ) : null}
        </div>
      </motion.div>
    </motion.div>
  );
}
