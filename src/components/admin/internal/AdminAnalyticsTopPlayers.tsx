// src/components/admin/internal/AdminAnalyticsTopPlayers.tsx - Ranking SVG de barras de los jugadores más activos (por duelos terminados).
import { ITopPlayersProps } from "@/components/admin/internal/admin-analytics-panel.types";

export function AdminAnalyticsTopPlayers({ data }: ITopPlayersProps) {
  if (data.length === 0) {
    return (
      <div className="rounded-lg border border-slate-700 bg-slate-900/70 p-3">
        <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-cyan-300">Jugadores Más Activos</h3>
        <p className="py-4 text-center text-xs text-slate-500">Sin datos disponibles.</p>
      </div>
    );
  }
  const maxDuels = Math.max(...data.map((d) => d.duels), 1);

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-900/70 p-3">
      <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-cyan-300">Jugadores Más Activos</h3>
      <div className="space-y-1.5">
        {data.map((player, index) => {
          const barWidth = (player.duels / maxDuels) * 100;
          return (
            <div key={player.userId} className="flex items-center gap-2 text-xs">
              <span className="w-4 shrink-0 text-right font-mono text-slate-500">{index + 1}</span>
              <span className="w-32 shrink-0 truncate text-right text-slate-300" title={player.nickname}>{player.nickname}</span>
              <div className="relative h-4 flex-1 overflow-hidden rounded bg-slate-800">
                <div className="absolute inset-y-0 left-0 rounded bg-emerald-600/70 transition-all" style={{ width: `${barWidth}%` }} />
              </div>
              <span className="w-14 shrink-0 text-right font-mono text-slate-300">{player.duels.toLocaleString()} ⚔</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
