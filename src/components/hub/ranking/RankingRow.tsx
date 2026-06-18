// src/components/hub/ranking/RankingRow.tsx - Fila memoizada de la lista de ranking (rank 4+) con avatar, liga y stats.
"use client";

import { memo } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { IRankingEntry } from "@/services/ranking/get-ranking-data";
import { getAvatarGradientClasses, getAvatarInitial } from "@/components/hub/internal/avatar-color";
import { getEloLeague, getLeagueStyle } from "./internal/tier";
import { areEqualRankingRowProps } from "./internal/ranking-equality";

interface RankingRowProps {
  entry: IRankingEntry;
  isLocal: boolean;
}

function winRate(wins: number, losses: number): string {
  const total = wins + losses;
  if (total === 0) return "—";
  return `${Math.round((wins / total) * 100)}%`;
}

/**
 * Fila de la lista de ranking. Memoizada por contenido. La liga se deriva del
 * ELO (bronce/plata/oro/diamante/maestro) y pinta un badge con glow estático.
 * La fila del jugador local lleva un ring cian para destacarla.
 */
function RankingRowComponent({ entry, isLocal }: RankingRowProps) {
  const league = getEloLeague(entry.eloRating);
  const style = getLeagueStyle(league);
  const avatar = getAvatarGradientClasses(entry.playerId);
  const initial = getAvatarInitial(entry.nickname);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: "spring", stiffness: 320, damping: 28 }}
      className={`grid grid-cols-[3.5rem_3.5rem_1fr_5rem_4.5rem_4rem] items-center gap-2 rounded-lg px-3 py-2 transition-colors ${
        isLocal
          ? "bg-cyan-500/12 ring-1 ring-inset ring-cyan-400/40"
          : "bg-slate-900/30 hover:bg-slate-800/40"
      }`}
    >
      {/* Rank */}
      <span className={`text-center text-sm font-black ${isLocal ? "text-cyan-300" : "text-slate-400"}`}>
        #{entry.rank}
      </span>

      {/* Avatar */}
      <div className={`relative h-8 w-8 overflow-hidden rounded-full border ${style.border}`}>
        {entry.avatarUrl ? (
          <Image src={entry.avatarUrl} alt={entry.nickname} fill sizes="32px" className="object-cover" />
        ) : (
          <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${avatar.from} ${avatar.to} text-xs font-black text-white`}>
            {initial}
          </div>
        )}
      </div>

      {/* Nickname + liga */}
      <div className="flex min-w-0 items-center gap-2">
        <span className={`truncate text-sm font-semibold ${isLocal ? "text-cyan-200" : "text-slate-200"}`}>
          {entry.nickname}
          {isLocal && <span className="ml-1 text-[10px] font-bold uppercase tracking-widest text-cyan-400">(tú)</span>}
        </span>
        <span className={`hidden shrink-0 rounded border ${style.border} px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest ${style.text} sm:inline`}>
          {style.label}
        </span>
      </div>

      {/* ELO */}
      <span className={`text-right text-sm font-black tabular-nums ${style.text}`}>{entry.eloRating}</span>

      {/* V/D */}
      <span className="text-right text-xs font-semibold tabular-nums">
        <span className="text-emerald-400">{entry.wins}</span>
        <span className="text-slate-600">/</span>
        <span className="text-rose-400">{entry.losses}</span>
      </span>

      {/* Win rate */}
      <span className="text-right text-xs font-semibold tabular-nums text-slate-400">
        {winRate(entry.wins, entry.losses)}
      </span>
    </motion.div>
  );
}

export const RankingRow = memo(RankingRowComponent, areEqualRankingRowProps);
