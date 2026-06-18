// src/components/hub/ranking/layout/RankingHeaderBar.tsx - Cabecera del ranking con BackButton a multijugador, título y ELO del jugador.
import { memo } from "react";
import Link from "next/link";
import { Zap, Users, Home } from "lucide-react";
import { BackButton } from "@/components/ui/BackButton";

interface RankingHeaderBarProps {
  /** Total de duelistas clasificados en el snapshot. */
  totalDuelists: number;
  /** ELO del jugador local, o null si no está en el top. */
  localPlayerElo: number | null;
  /** Posición del jugador local, o null si no está en el top. */
  localPlayerRank: number | null;
}

/**
 * Cabecera del ranking. Memoizada por contenido: solo repinta cuando cambian
 * los contadores. BackButton apunta a /hub/multiplayer (flujo ranking↔multi),
 * y hay un link secundario a /hub para volver a la sala de control.
 * Muestra el ELO del jugador local en vez de TOP para que no tenga que buscarse.
 */
function RankingHeaderBarComponent({ totalDuelists, localPlayerElo, localPlayerRank }: RankingHeaderBarProps) {
  return (
    <header className="relative w-full rounded-xl border border-cyan-800/50 bg-[#041120]/90 p-2 shadow-[0_0_20px_rgba(8,145,178,0.15),inset_0_0_20px_rgba(0,0,0,0.6)] backdrop-blur-xl sm:px-4 sm:py-2.5">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-xl bg-[linear-gradient(120deg,rgba(34,211,238,0.05),transparent_45%,rgba(59,130,246,0.05))]"
      />
      <div className="relative flex items-center gap-3">
        <BackButton href="/hub/multiplayer" label="" className="px-2 py-1.5" />

        <h1 className="hidden truncate text-lg font-black uppercase tracking-widest text-cyan-100 drop-shadow-[0_0_10px_rgba(34,211,238,0.6)] sm:block">
          Ranking
        </h1>

        {/* Stats globales */}
        <div className="ml-auto flex items-center gap-1.5 sm:gap-2.5">
          {localPlayerElo !== null && (
            <div
              className="flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-[#020a14]/90 px-2.5 py-1.5 shadow-[inset_0_0_10px_rgba(0,0,0,0.6)] sm:gap-2 sm:px-3.5"
              aria-label={`Tu ELO: ${localPlayerElo}`}
            >
              <Zap size={16} className="text-amber-400" />
              <span className="text-sm font-black tabular-nums text-amber-300 sm:text-base">
                {localPlayerElo}
              </span>
              <span className="hidden text-[11px] font-bold uppercase tracking-widest text-amber-600 sm:inline">ELO</span>
            </div>
          )}
          <div
            className="flex items-center gap-1.5 rounded-lg border border-cyan-500/40 bg-[#020a14]/90 px-2.5 py-1.5 shadow-[inset_0_0_10px_rgba(0,0,0,0.6)] sm:gap-2 sm:px-3.5"
            aria-label={`${totalDuelists} duelistas clasificados`}
          >
            <Users size={16} className="text-cyan-400" />
            <span className="text-sm font-black tabular-nums text-cyan-300 sm:text-base">{totalDuelists}</span>
            <span className="hidden text-[11px] font-bold uppercase tracking-widest text-cyan-600 sm:inline">duelistas</span>
          </div>
          {localPlayerRank && (
            <div
              className="flex items-center gap-1.5 rounded-lg border border-emerald-500/50 bg-emerald-500/10 px-2.5 py-1.5 shadow-[0_0_10px_rgba(52,211,153,0.25)] sm:gap-2 sm:px-3.5"
              aria-label={`Tu posición: ${localPlayerRank}`}
            >
              <span className="text-sm font-black tabular-nums text-emerald-300 sm:text-base">#{localPlayerRank}</span>
              <span className="hidden text-[11px] font-bold uppercase tracking-widest text-emerald-400 sm:inline">tú</span>
            </div>
          )}
        </div>

        <Link
          href="/hub"
          aria-label="Volver a la sala de control"
          className="flex shrink-0 items-center gap-2 rounded-lg border border-slate-600/50 bg-[#021426]/85 px-3 py-2 text-sm font-black uppercase tracking-widest text-slate-300 transition hover:border-slate-400/70 hover:bg-slate-700/40 hover:text-slate-100 sm:px-4"
        >
          <Home size={16} className="shrink-0" />
          <span className="hidden sm:inline">Hub</span>
        </Link>
      </div>
    </header>
  );
}

export const RankingHeaderBar = memo(RankingHeaderBarComponent);
