// src/components/hub/market/listings/MarketListingsPanel.tsx - Grid de cartas de mercado con precio flotante y selección de detalle.
"use client";

import { CardThumbnail } from "@/components/game/card/CardThumbnail";
import { useVirtualGridWindow } from "@/components/hub/internal/useVirtualGridWindow";
import { IMarketCardListing } from "@/core/entities/market/IMarketCardListing";
import { memo, useRef } from "react";

interface MarketListingsPanelProps {
  listings: IMarketCardListing[];
  onSelectCard: (listing: IMarketCardListing) => void;
  isPerformanceMode: boolean;
}

function MarketListingsPanelComponent({ listings, onSelectCard, isPerformanceMode }: MarketListingsPanelProps) {
  const scrollRef = useRef<HTMLElement>(null);
  // La virtualización renderiza solo la ventana visible (+ overscan); el resto se monta al hacer scroll.
  const windowState = useVirtualGridWindow({
    containerRef: scrollRef,
    itemCount: listings.length,
    itemMinWidth: 90,
    itemHeight: 140,
    gap: 12,
    overscanRows: isPerformanceMode ? 1 : 2,
  });
  const visibleListings = listings.slice(windowState.startIndex, windowState.endIndex);
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
            style={{ contentVisibility: "auto", containIntrinsicSize: "96px 140px" }}
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
              {/* Miniatura centrada bajo el precio: ancho fijo (no derivado de la altura) -> mismo
                  tamaño para todas las cartas sin importar la longitud del nombre. */}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 top-4 flex items-center justify-center p-1">
                <div className="aspect-[13/19] w-full max-w-[72px]">
                  <CardThumbnail card={listing.card} />
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

/** Memoizado: seleccionar una carta no debe re-renderizar el grid completo de listados. */
export const MarketListingsPanel = memo(MarketListingsPanelComponent);
