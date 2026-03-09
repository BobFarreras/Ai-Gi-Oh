// src/components/hub/market/listings/MarketListingsPanel.tsx - Grid de cartas de mercado con precio flotante y selección de detalle.
"use client";

import { Card } from "@/components/game/card/Card";
import { useVirtualGridWindow } from "@/components/hub/internal/useVirtualGridWindow";
import { IMarketCardListing } from "@/core/entities/market/IMarketCardListing";
import { useEffect, useRef, useState } from "react";

interface MarketListingsPanelProps {
  listings: IMarketCardListing[];
  onSelectCard: (listing: IMarketCardListing) => void;
}

export function MarketListingsPanel({ listings, onSelectCard }: MarketListingsPanelProps) {
  const scrollRef = useRef<HTMLElement>(null);
  const [isInitialBatchActive, setIsInitialBatchActive] = useState(true);
  const windowState = useVirtualGridWindow({
    containerRef: scrollRef,
    itemCount: listings.length,
    itemMinWidth: 90,
    itemHeight: 140,
    gap: 12,
    overscanRows: 2,
  });
  useEffect(() => {
    const timeoutId = window.setTimeout(() => setIsInitialBatchActive(false), 650);
    return () => window.clearTimeout(timeoutId);
  }, []);
  const initialEndIndex = Math.min(windowState.endIndex, windowState.startIndex + 8);
  const endIndex = isInitialBatchActive ? initialEndIndex : windowState.endIndex;
  const visibleListings = listings.slice(windowState.startIndex, endIndex);
  return (
    <section
      ref={scrollRef}
      className="home-modern-scroll h-full min-h-0 overflow-y-auto overflow-x-hidden rounded-xl border border-cyan-800/35 bg-[#031020]/55 p-3 sm:p-4"
    >
      <div className="relative pb-6" style={{ height: `${windowState.totalHeight}px` }}>
        <div
          className="grid w-full grid-cols-4 content-start justify-items-center gap-2 sm:grid-cols-5 sm:gap-3 md:grid-cols-[repeat(auto-fill,minmax(90px,1fr))]"
          style={{ transform: `translateY(${windowState.offsetTop}px)` }}
        >
        {visibleListings.map((listing) => (
          <article
            key={listing.id}
            className={`relative w-full max-w-[88px] aspect-[5/7] rounded-lg border-2 sm:max-w-[96px] ${
              listing.isAvailable 
                ? "border-cyan-900/60 bg-[#081220] hover:border-cyan-400/80 cursor-pointer shadow-[0_0_10px_rgba(34,211,238,0.1)]" 
                : "border-zinc-800 bg-zinc-950/80 grayscale-[80%] opacity-60 cursor-pointer"
            } overflow-hidden transition-all duration-300`}
            style={{ contentVisibility: "auto", containIntrinsicSize: "140px 96px" }}
            aria-label={`${listing.card.name} disponible por ${listing.priceNexus} Nexus`}
          >
            {/* Etiqueta de Precio */}
            <span className={`absolute top-0 inset-x-0 z-20 text-center py-0.5 text-[9px] font-black uppercase tracking-widest border-b ${
              listing.isAvailable 
                ? "bg-cyan-950/90 text-cyan-300 border-cyan-500/50 shadow-[0_2px_5px_rgba(0,0,0,0.8)]" 
                : "bg-zinc-900/90 text-zinc-400 border-zinc-700/50"
            }`}>
              {listing.isAvailable ? `${listing.priceNexus} NX` : "En Pack"}
            </span>

            <button
              type="button"
              aria-label={`Seleccionar ${listing.card.name}`}
              className="absolute inset-0 w-full h-full text-left"
              onClick={() => onSelectCard(listing)}
            >
              {/* Contenedor seguro para escalar la carta sin romper el layout */}
              <div className="absolute inset-0 flex top-5 items-center justify-center pointer-events-none">
                <div className="scale-[0.24] origin-center sm:scale-[0.28] md:scale-[0.3]">
                  <Card card={listing.card} disableHoverEffects disableDefaultShadow isPerformanceMode />
                </div>
              </div>
            </button>
          </article>
        ))}
        </div>
      </div>
    </section>
  );
}
