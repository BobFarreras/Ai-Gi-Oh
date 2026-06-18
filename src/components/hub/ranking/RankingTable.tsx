// src/components/hub/ranking/RankingTable.tsx - Tabla de clasificación ELO de jugadores.
import Image from "next/image";
import { IRankingEntry } from "@/services/ranking/get-ranking-data";

interface RankingTableProps {
  entries: IRankingEntry[];
  localPlayerId: string | null;
}

const MEDAL: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

function winRate(wins: number, losses: number): string {
  const total = wins + losses;
  if (total === 0) return "—";
  return `${Math.round((wins / total) * 100)}%`;
}

export function RankingTable({ entries, localPlayerId }: RankingTableProps) {
  if (entries.length === 0) {
    return (
      <div className="rounded-xl border border-slate-700/50 bg-slate-900/40 px-4 py-8 text-center">
        <p className="text-sm text-slate-400">Aún no hay duelistas clasificados.</p>
        <p className="mt-1 text-xs text-slate-500">Completa una partida multijugador para aparecer aquí.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-700/50">
      {/* Cabecera */}
      <div className="grid grid-cols-[3rem_1fr_5rem_4rem_4rem_4rem] items-center gap-2 border-b border-slate-700/60 bg-slate-900/60 px-4 py-2">
        <span className="text-center text-[10px] font-bold uppercase tracking-widest text-slate-500">#</span>
        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Duelista</span>
        <span className="text-right text-[10px] font-bold uppercase tracking-widest text-slate-500">ELO</span>
        <span className="text-right text-[10px] font-bold uppercase tracking-widest text-slate-500">V</span>
        <span className="text-right text-[10px] font-bold uppercase tracking-widest text-slate-500">D</span>
        <span className="text-right text-[10px] font-bold uppercase tracking-widest text-slate-500">%</span>
      </div>

      {/* Filas */}
      <div className="divide-y divide-slate-800/50">
        {entries.map((entry) => {
          const isLocal = entry.playerId === localPlayerId;
          const medal = MEDAL[entry.rank];
          return (
            <div
              key={entry.playerId}
              className={`grid grid-cols-[3rem_1fr_5rem_4rem_4rem_4rem] items-center gap-2 px-4 py-3 transition-colors ${
                isLocal
                  ? "bg-cyan-500/10 ring-1 ring-inset ring-cyan-400/25"
                  : "bg-slate-900/20 hover:bg-slate-800/30"
              }`}
            >
              {/* Rank */}
              <span className="text-center text-sm font-black text-slate-400">
                {medal ?? `#${entry.rank}`}
              </span>

              {/* Avatar + Nickname */}
              <div className="flex min-w-0 items-center gap-2.5">
                <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full border border-slate-600/60">
                  {entry.avatarUrl ? (
                    <Image
                      src={entry.avatarUrl}
                      alt={entry.nickname}
                      fill
                      sizes="32px"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-slate-700 text-xs font-bold text-slate-300">
                      {entry.nickname.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <span className={`truncate text-sm font-semibold ${isLocal ? "text-cyan-200" : "text-slate-200"}`}>
                  {entry.nickname}
                  {isLocal && (
                    <span className="ml-1.5 text-[10px] font-bold uppercase tracking-widest text-cyan-400">(tú)</span>
                  )}
                </span>
              </div>

              {/* ELO */}
              <span className={`text-right text-sm font-black ${isLocal ? "text-cyan-300" : "text-slate-200"}`}>
                {entry.eloRating}
              </span>

              {/* Wins */}
              <span className="text-right text-sm font-semibold text-emerald-400">{entry.wins}</span>

              {/* Losses */}
              <span className="text-right text-sm font-semibold text-red-400">{entry.losses}</span>

              {/* Win rate */}
              <span className="text-right text-sm font-semibold text-slate-400">
                {winRate(entry.wins, entry.losses)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
