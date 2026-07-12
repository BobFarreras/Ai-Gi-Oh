// src/components/hub/ranking/RankingBoardRow.tsx - Fila unificada para cualquier ranking (multijugador,
// actividad, comercial). Es la MISMA para los tres tableros, por eso al cambiar de ranking framer-motion
// (layout) puede animar a cada jugador hacia su nueva posición. El top 3 recibe medalla + glow de podio.
"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { RankingBoardId, IRankingBoardEntry } from "@/services/ranking/get-ranking-boards";
import { getAvatarGradientClasses, getAvatarInitial } from "@/components/hub/internal/avatar-color";
import { getEloLeague, getLeagueStyle, getPodiumStyle, getPodiumTier, PodiumTier } from "./internal/tier";
import { RankingTopAvatar } from "./RankingTopAvatar";
import { PlayerFormDots } from "./internal/PlayerFormDots";

interface RankingBoardRowProps {
  entry: IRankingBoardEntry;
  isLocal: boolean;
  boardId: RankingBoardId;
}

const MEDAL_GRADIENT: Record<PodiumTier, string> = {
  gold: "from-amber-300 to-yellow-600",
  silver: "from-slate-200 to-slate-400",
  bronze: "from-orange-500 to-amber-800",
};

/** Color del valor y etiqueta de la columna de métrica según el tablero. */
const BOARD_VALUE: Record<RankingBoardId, { label: string; color: string; sub: string }> = {
  MULTIPLAYER: { label: "ELO", color: "text-cyan-200", sub: "Liga" },
  ACTIVITY: { label: "pts", color: "text-cyan-300", sub: "Actividad" },
  COMMERCIAL: { label: "pts", color: "text-amber-300", sub: "Comercio" },
};

function winRate(wins: number, losses: number): string {
  const total = wins + losses;
  if (total === 0) return "—";
  return `${Math.round((wins / total) * 100)}%`;
}

export function RankingBoardRow({ entry, isLocal, boardId }: RankingBoardRowProps) {
  const tier = getPodiumTier(entry.rank);
  const podium = tier ? getPodiumStyle(tier) : null;
  const avatar = getAvatarGradientClasses(entry.playerId);
  const initial = getAvatarInitial(entry.nickname);
  const isMultiplayer = boardId === "MULTIPLAYER";
  const league = isMultiplayer ? getLeagueStyle(getEloLeague(entry.value)) : null;
  // En multijugador el valor toma el color de la liga; en los semanales, el color del tablero.
  const valueColor = league ? league.text : BOARD_VALUE[boardId].color;
  const subLabel = league ? league.label : BOARD_VALUE[boardId].sub;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.94 }}
      transition={{ type: "spring", stiffness: 340, damping: 30 }}
      className={`relative flex items-center gap-2.5 overflow-hidden rounded-xl border px-2.5 py-2 sm:gap-3 sm:px-3 sm:py-2.5 ${
        podium
          ? `${podium.border} ${podium.glow} bg-[#020a14]/70`
          : isLocal
            ? "border-cyan-400/40 bg-cyan-500/12 ring-1 ring-inset ring-cyan-400/40"
            : "border-slate-700/40 bg-slate-900/30 hover:bg-slate-800/40"
      }`}
    >
      {tier ? <div aria-hidden className={`absolute inset-y-0 left-0 w-1 bg-gradient-to-b ${MEDAL_GRADIENT[tier]}`} /> : null}

      {/* Rank / medalla */}
      <div className="flex w-8 shrink-0 justify-center sm:w-10">
        {tier ? (
          <div className={`flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br ${MEDAL_GRADIENT[tier]} text-sm font-black text-slate-900 shadow-[0_0_14px_rgba(251,191,36,0.4)] sm:h-9 sm:w-9`}>
            {entry.rank}
          </div>
        ) : (
          <span className={`text-sm font-black tabular-nums ${isLocal ? "text-cyan-300" : "text-slate-400"}`}>#{entry.rank}</span>
        )}
      </div>

      {/* Avatar */}
      {tier ? (
        <RankingTopAvatar playerId={entry.playerId} nickname={entry.nickname} avatarUrl={entry.avatarUrl} tier={tier} />
      ) : (
        <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full border border-slate-600/50">
          {entry.avatarUrl ? (
            <Image src={entry.avatarUrl} alt={entry.nickname} fill sizes="32px" className="object-cover" />
          ) : (
            <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${avatar.from} ${avatar.to} text-xs font-black text-white`}>
              {initial}
            </div>
          )}
        </div>
      )}

      {/* Nombre + subetiqueta */}
      <div className="flex min-w-0 flex-1 flex-col">
        <span className={`truncate text-sm font-bold ${tier ? "text-slate-100" : isLocal ? "text-cyan-200" : "text-slate-200"} sm:text-base`}>
          {entry.nickname}
          {isLocal ? <span className="ml-1.5 text-[10px] font-bold uppercase tracking-widest text-cyan-400">(tú)</span> : null}
        </span>
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{subLabel}</span>
      </div>

      {/* Forma reciente (solo multijugador) */}
      {isMultiplayer && entry.recentForm ? <PlayerFormDots form={entry.recentForm} /> : null}

      {/* Métrica principal */}
      <div className="flex shrink-0 flex-col items-end">
        <span className={`text-base font-black tabular-nums ${valueColor} sm:text-lg`}>{entry.value.toLocaleString()}</span>
        {isMultiplayer && entry.wins !== undefined && entry.losses !== undefined ? (
          <span className="text-[10px] font-semibold tabular-nums text-slate-500">
            <span className="text-emerald-400">{entry.wins}</span>/<span className="text-rose-400">{entry.losses}</span>
            <span className="ml-1 text-slate-500">· {winRate(entry.wins, entry.losses)}</span>
          </span>
        ) : (
          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{BOARD_VALUE[boardId].label}</span>
        )}
      </div>
    </motion.div>
  );
}
