// src/components/hub/market/MarketListingsPanel.tsx - Cuadrícula de cartas del mercado con selección y compra.
"use client";

import { Card } from "@/components/game/card/Card";
import { IMarketCardListing } from "@/core/entities/market/IMarketCardListing";

interface MarketListingsPanelProps {
  listings: IMarketCardListing[];
  onSelectCard: (listing: IMarketCardListing) => void;
  onBuyCard: (listingId: string) => Promise<void>;
}

export function MarketListingsPanel({ listings, onSelectCard, onBuyCard }: MarketListingsPanelProps) {
  return (
    <section className="home-modern-scroll min-h-0 overflow-y-auto rounded-2xl border border-cyan-800/35 bg-[#031020]/55 p-3">
      <div className="grid grid-cols-5 gap-2">
        {listings.map((listing) => (
          <article
            key={listing.id}
            className="border border-cyan-950/55 bg-[#020f1c]/70 p-1"
            aria-label={`${listing.card.name} disponible por ${listing.priceNexus} Nexus`}
          >
            <button
              type="button"
              aria-label={`Seleccionar ${listing.card.name}`}
              className="w-full text-left"
              onClick={() => onSelectCard(listing)}
            >
              <div className="origin-top-left scale-[0.33]">
                <Card card={listing.card} />
              </div>
            </button>
            <p className="-mt-56 text-center text-[10px] font-bold text-cyan-100">{listing.priceNexus} NX</p>
            <button
              type="button"
              aria-label={`Comprar ${listing.card.name}`}
              onClick={() => onBuyCard(listing.id)}
              className="mt-1 w-full border border-cyan-300/35 bg-cyan-400/10 py-1 text-[10px] font-black uppercase"
            >
              Comprar
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}
