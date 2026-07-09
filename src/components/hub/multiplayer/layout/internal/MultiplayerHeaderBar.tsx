// src/components/hub/multiplayer/layout/internal/MultiplayerHeaderBar.tsx - Cabecera del lobby con BackButton, título y stats en vivo de presencia.
"use client";

import { memo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Trophy, Users } from "lucide-react";
import { BackButton } from "@/components/ui/BackButton";

interface MultiplayerHeaderBarProps {
  /** Total de duelistas conectados (excluyendo al jugador local). */
  onlineCount: number;
  /** Duelistas actualmente en partida. */
  inMatchCount: number;
}

/**
 * Cabecera del lobby. Memoizada por contenido: solo repinta cuando cambian
 * los contadores de presencia. El BackButton ya gestiona su propio SFX.
 */
function MultiplayerHeaderBarComponent({ onlineCount, inMatchCount }: MultiplayerHeaderBarProps) {
  return (
    <header className="relative w-full rounded-xl border border-cyan-800/50 bg-[#041120]/90 p-2 shadow-[0_0_20px_rgba(8,145,178,0.15),inset_0_0_20px_rgba(0,0,0,0.6)] backdrop-blur-xl sm:px-4 sm:py-2.5">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-xl bg-[linear-gradient(120deg,rgba(34,211,238,0.05),transparent_45%,rgba(59,130,246,0.05))]"
      />
      <div className="relative flex items-center gap-2 sm:gap-3">
        <BackButton href="/hub" label="" className="px-2 py-1.5" />

        <h1 className="hidden truncate text-lg font-black uppercase tracking-widest text-cyan-100 drop-shadow-[0_0_10px_rgba(34,211,238,0.6)] sm:block">
          Multijugador
        </h1>

        {/* Stats en vivo de presencia */}
        <motion.div
          layout
          className="ml-auto flex items-center gap-1.5 sm:gap-2.5"
        >
          <div
            className="flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-[#020a14]/90 px-2.5 py-1.5 shadow-[inset_0_0_10px_rgba(0,0,0,0.6)] sm:gap-2 sm:px-3.5"
            aria-label={`${onlineCount} duelistas en línea`}
          >
            <Users size={16} className="text-emerald-400" />
            <span className="text-base font-black tabular-nums text-emerald-300">{onlineCount}</span>
            <span className="hidden text-[11px] font-bold uppercase tracking-widest text-emerald-600 sm:inline">online</span>
          </div>
          <div
            className="flex items-center gap-1.5 rounded-lg border border-rose-500/40 bg-[#020a14]/90 px-2.5 py-1.5 shadow-[inset_0_0_10px_rgba(0,0,0,0.6)] sm:gap-2 sm:px-3.5"
            aria-label={`${inMatchCount} duelistas en duelo`}
          >
            <span className="h-2 w-2 rounded-full bg-rose-400 shadow-[0_0_6px_rgba(248,113,113,0.85)]" />
            <span className="text-base font-black tabular-nums text-rose-300">{inMatchCount}</span>
            <span className="hidden text-[11px] font-bold uppercase tracking-widest text-rose-600 sm:inline">en duelo</span>
          </div>
        </motion.div>

        <Link
          href="/hub/ranking"
          aria-label="Ir al ranking global"
          className="flex shrink-0 items-center gap-2 rounded-lg border border-cyan-500/50 bg-[#021426]/85 px-2.5 py-2 text-sm font-black uppercase tracking-widest text-cyan-200 transition hover:border-cyan-400/80 hover:bg-cyan-950/40 hover:shadow-[0_0_14px_rgba(34,211,238,0.35)] sm:px-4"
        >
          <Trophy size={16} />
          <span className="hidden sm:inline">Ranking</span>
        </Link>
      </div>
    </header>
  );
}

export const MultiplayerHeaderBar = memo(MultiplayerHeaderBarComponent);
