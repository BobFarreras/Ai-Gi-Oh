// src/components/hub/market/MarketPacksPanel.tsx - Panel de compra de sobres con resumen y acción principal.
"use client";

import { IMarketPackDefinition } from "@/core/entities/market/IMarketPackDefinition";

interface MarketPacksPanelProps {
  packs: IMarketPackDefinition[];
  onBuyPack: (packId: string) => Promise<void>;
}

export function MarketPacksPanel({ packs, onBuyPack }: MarketPacksPanelProps) {
  return (
    <section className="space-y-3 rounded-2xl border border-cyan-800/35 bg-[#031020]/55 p-3">
      <h2 className="text-sm font-black uppercase tracking-[0.2em] text-cyan-200">Sobres</h2>
      {packs.map((pack) => (
        <article key={pack.id} className="border border-cyan-700/35 bg-[#08243a]/70 p-3">
          <p className="text-sm font-black uppercase text-cyan-100">{pack.name}</p>
          <p className="mt-1 text-xs text-slate-300">{pack.description}</p>
          <p className="mt-1 text-xs font-bold text-cyan-200">
            {pack.cardsPerPack} cartas · {pack.priceNexus} NX
          </p>
          <button
            type="button"
            aria-label={`Comprar ${pack.name}`}
            onClick={() => onBuyPack(pack.id)}
            className="mt-2 w-full border border-emerald-300/40 bg-emerald-500/12 py-1.5 text-xs font-black uppercase text-emerald-100"
          >
            Comprar Sobre
          </button>
        </article>
      ))}
    </section>
  );
}
