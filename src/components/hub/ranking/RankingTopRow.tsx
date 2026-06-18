// src/components/hub/ranking/RankingTopRow.tsx - Fila destacada del top 3 con medalla holográfica, glow y estilo personalizado por tier (oro/plata/bronce).
"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import { IRankingEntry } from "@/services/ranking/get-ranking-data";
import { getPodiumStyle, getPodiumTier, PodiumTier } from "./internal/tier";
import { areEqualRankingRowProps } from "./internal/ranking-equality";
import { RankingTopAvatar } from "./RankingTopAvatar";

interface RankingTopRowProps {
  entry: IRankingEntry;
  isLocal: boolean;
}

/** Gradiente de la medalla (círculo con número) según tier. */
const MEDAL_GRADIENT: Record<PodiumTier, string> = {
  gold: "from-amber-300 to-yellow-600",
  silver: "from-slate-200 to-slate-400",
  bronze: "from-orange-500 to-amber-800",
};

/** Gradiente del accent bar lateral según tier (estático, sin filter). */
const ACCENT_GRADIENT: Record<PodiumTier, string> = {
  gold: "from-amber-300 to-yellow-700",
  silver: "from-slate-200 to-slate-500",
  bronze: "from-orange-500 to-amber-900",
};

function winRate(wins: number, losses: number): string {
  const total = wins + losses;
  if (total === 0) return "—";
  return `${Math.round((wins / total) * 100)}%`;
}

/**
 * Fila del top 3 (rank 1-3). Más alta que la compacta, con medalla
 * holográfica (número en círculo con gradiente tier), avatar grande con ring,
 * glow estático por tier y ELO destacado. Mismo grid que RankingRow para
 * alinear con la cabecera de la lista.
 */
function RankingTopRowComponent({ entry, isLocal }: RankingTopRowProps) {
  const tier = getPodiumTier(entry.rank);
  if (!tier) return null; // Salvaguarda: solo ranks 1-3.
  const style = getPodiumStyle(tier);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 280, damping: 24 }}
      className={`relative grid grid-cols-[2.5rem_2.5rem_1fr_3.5rem_3rem] items-center gap-1.5 overflow-hidden rounded-xl border ${style.border} ${style.glow} bg-[#020a14]/70 px-2.5 py-2.5 backdrop-blur-sm sm:grid-cols-[3.5rem_3.5rem_1fr_5rem_4.5rem_4rem] sm:gap-2 sm:px-3 sm:py-3`}
    >
      {/* Accent bar lateral por tier (gradiente estático, no filter) */}
      <div aria-hidden className={`absolute inset-y-0 left-0 w-1 bg-gradient-to-b ${ACCENT_GRADIENT[tier]}`} />

      {/* Medalla: número de rank en círculo holográfico con gradiente tier */}
      <div className="flex justify-center">
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br ${MEDAL_GRADIENT[tier]} text-sm font-black text-slate-900 shadow-[0_0_14px_rgba(251,191,36,0.45)] sm:h-10 sm:w-10 sm:text-base`}
        >
          {entry.rank}
        </div>
      </div>

      {/* Avatar del top 3 con corona y anillo rotatorio por tier */}
      <RankingTopAvatar
        playerId={entry.playerId}
        nickname={entry.nickname}
        avatarUrl={entry.avatarUrl}
        tier={tier}
      />

      {/* Nickname + etiqueta de tier (oculta en móvil para evitar cortes) */}
      <div className="flex min-w-0 flex-col">
        <span className="truncate text-sm font-black text-slate-100 sm:text-base">
          {entry.nickname}
          {isLocal && <span className="ml-1.5 text-[10px] font-bold uppercase tracking-widest text-cyan-400">(tú)</span>}
        </span>
        <span className={`hidden text-[10px] font-bold uppercase tracking-widest ${style.text} sm:block`}>{style.label}</span>
      </div>

      {/* ELO destacado */}
      <span className={`text-right text-base font-black tabular-nums ${style.text} sm:text-xl`}>{entry.eloRating}</span>

      {/* V/D */}
      <span className="text-right text-xs font-bold tabular-nums sm:text-sm">
        <span className="text-emerald-400">{entry.wins}</span>
        <span className="text-slate-600">/</span>
        <span className="text-rose-400">{entry.losses}</span>
      </span>

      {/* Win rate (oculto en móvil para liberar espacio) */}
      <span className="hidden text-right text-sm font-semibold tabular-nums text-slate-400 sm:block">
        {winRate(entry.wins, entry.losses)}
      </span>
    </motion.div>
  );
}

export const RankingTopRow = memo(RankingTopRowComponent, areEqualRankingRowProps);
