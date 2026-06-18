// src/components/hub/ranking/RankingTopRow.tsx - Fila destacada del top 3 con medalla holográfica, glow y estilo personalizado por tier (oro/plata/bronce).
"use client";

import { memo } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { IRankingEntry } from "@/services/ranking/get-ranking-data";
import { getAvatarGradientClasses, getAvatarInitial } from "@/components/hub/internal/avatar-color";
import { getPodiumStyle, getPodiumTier, PodiumTier } from "./internal/tier";
import { areEqualRankingRowProps } from "./internal/ranking-equality";

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
  const avatar = getAvatarGradientClasses(entry.playerId);
  const initial = getAvatarInitial(entry.nickname);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 280, damping: 24 }}
      className={`relative grid grid-cols-[3.5rem_3.5rem_1fr_5rem_4.5rem_4rem] items-center gap-2 overflow-hidden rounded-xl border ${style.border} ${style.glow} bg-[#020a14]/70 px-3 py-3 backdrop-blur-sm`}
    >
      {/* Accent bar lateral por tier (gradiente estático, no filter) */}
      <div aria-hidden className={`absolute inset-y-0 left-0 w-1 bg-gradient-to-b ${ACCENT_GRADIENT[tier]}`} />

      {/* Medalla: número de rank en círculo holográfico con gradiente tier */}
      <div className="flex justify-center">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br ${MEDAL_GRADIENT[tier]} text-base font-black text-slate-900 shadow-[0_0_14px_rgba(251,191,36,0.45)]`}
        >
          {entry.rank}
        </div>
      </div>

      {/* Avatar grande con ring de tier */}
      <div className={`relative h-12 w-12 overflow-hidden rounded-full border-2 ${style.border}`}>
        {entry.avatarUrl ? (
          <Image src={entry.avatarUrl} alt={entry.nickname} fill sizes="48px" className="object-cover" />
        ) : (
          <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${avatar.from} ${avatar.to} text-base font-black text-white`}>
            {initial}
          </div>
        )}
      </div>

      {/* Nickname + etiqueta de tier (Campeón/Subcampeón/Tercer puesto) */}
      <div className="flex min-w-0 flex-col">
        <span className="truncate text-base font-black text-slate-100">
          {entry.nickname}
          {isLocal && <span className="ml-1.5 text-[10px] font-bold uppercase tracking-widest text-cyan-400">(tú)</span>}
        </span>
        <span className={`text-[10px] font-bold uppercase tracking-widest ${style.text}`}>{style.label}</span>
      </div>

      {/* ELO grande destacado */}
      <span className={`text-right text-xl font-black tabular-nums ${style.text}`}>{entry.eloRating}</span>

      {/* V/D */}
      <span className="text-right text-sm font-bold tabular-nums">
        <span className="text-emerald-400">{entry.wins}</span>
        <span className="text-slate-600">/</span>
        <span className="text-rose-400">{entry.losses}</span>
      </span>

      {/* Win rate */}
      <span className="text-right text-sm font-semibold tabular-nums text-slate-400">
        {winRate(entry.wins, entry.losses)}
      </span>
    </motion.div>
  );
}

export const RankingTopRow = memo(RankingTopRowComponent, areEqualRankingRowProps);
