// src/components/admin/internal/AdminAnalyticsCardRanking.tsx - Ranking SVG de barras de cartas (reutilizable para "más usadas" y "más compradas").
import { ICardRankingProps } from "@/components/admin/internal/admin-analytics-panel.types";

export function AdminAnalyticsCardRanking({ title, data }: ICardRankingProps) {
  if (data.length === 0) {
    return (
      <div className="rounded-lg border border-slate-700 bg-slate-900/70 p-3">
        <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-cyan-300">{title}</h3>
        <p className="py-4 text-center text-xs text-slate-500">Sin datos disponibles.</p>
      </div>
    );
  }
  const maxCount = Math.max(...data.map((d) => d.count), 1);

  return (
    <div className="rounded-lg border border-slate-700 bg-slate-900/70 p-3">
      <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-cyan-300">{title}</h3>
      <div className="space-y-1.5">
        {data.map((card, index) => {
          const barWidth = (card.count / maxCount) * 100;
          return (
            <div key={card.cardId} className="flex items-center gap-2 text-xs">
              <span className="w-4 shrink-0 text-right font-mono text-slate-500">{index + 1}</span>
              <span className="w-36 shrink-0 truncate text-right text-slate-300" title={card.cardName}>{card.cardName}</span>
              <div className="relative h-4 flex-1 overflow-hidden rounded bg-slate-800">
                <div className="absolute inset-y-0 left-0 rounded bg-fuchsia-600/70 transition-all" style={{ width: `${barWidth}%` }} />
              </div>
              <span className="w-12 shrink-0 text-right font-mono text-slate-300">{card.count.toLocaleString()}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
