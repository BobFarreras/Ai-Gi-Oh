// src/components/admin/internal/AdminAnalyticsCardRanking.tsx - Ranking de barras de cartas (clicable: abre detalle con imagen y stats). Reutilizable para "más usadas" y "más compradas".
"use client";

import { useState } from "react";
import { ICardRankingProps } from "@/components/admin/internal/admin-analytics-panel.types";
import { CARD_BY_ID } from "@/infrastructure/repositories/internal/card-catalog";
import { AdminAnalyticsCardDetailModal } from "@/components/admin/internal/AdminAnalyticsCardDetailModal";

/** Etiqueta corta en español por tipo de carta del catálogo. */
const CARD_TYPE_LABEL: Record<string, string> = {
  ENTITY: "Entidad",
  EXECUTION: "Ejecución",
  TRAP: "Trampa",
  FUSION: "Fusión",
};

export function AdminAnalyticsCardRanking({ title, data }: ICardRankingProps) {
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const selectedCard = selectedCardId ? CARD_BY_ID.get(selectedCardId) ?? null : null;
  const selectedCount = selectedCardId ? data.find((c) => c.cardId === selectedCardId)?.count ?? 0 : 0;

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
          const hasDetail = CARD_BY_ID.has(card.cardId);
          return (
            <button
              type="button"
              key={card.cardId}
              onClick={() => hasDetail && setSelectedCardId(card.cardId)}
              disabled={!hasDetail}
              className="flex w-full items-center gap-2 rounded text-xs enabled:hover:bg-slate-800/60 disabled:cursor-default"
              title={hasDetail ? `Ver detalle de ${card.cardName}` : card.cardName}
            >
              <span className="w-4 shrink-0 text-right font-mono text-slate-500">{index + 1}</span>
              <span className="flex w-40 shrink-0 items-center justify-end gap-1 text-right">
                <span className="truncate text-slate-300">{card.cardName}</span>
                {card.cardType ? (
                  <span className="shrink-0 rounded bg-slate-700/70 px-1 text-[9px] uppercase tracking-wide text-slate-400">
                    {CARD_TYPE_LABEL[card.cardType] ?? card.cardType}
                  </span>
                ) : null}
              </span>
              <div className="relative h-4 flex-1 overflow-hidden rounded bg-slate-800">
                <div className="absolute inset-y-0 left-0 rounded bg-fuchsia-600/70 transition-all" style={{ width: `${barWidth}%` }} />
              </div>
              <span className="w-12 shrink-0 text-right font-mono text-slate-300">{card.count.toLocaleString()}</span>
            </button>
          );
        })}
      </div>

      {selectedCard ? (
        <AdminAnalyticsCardDetailModal card={selectedCard} usageCount={selectedCount} onClose={() => setSelectedCardId(null)} />
      ) : null}
    </div>
  );
}
