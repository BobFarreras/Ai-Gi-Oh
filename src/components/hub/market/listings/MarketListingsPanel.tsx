// src/components/hub/market/listings/MarketListingsPanel.tsx - Grid de cartas de mercado con precio flotante y selección de detalle.
"use client";

import { CardThumbnail } from "@/components/game/card/CardThumbnail";
import { IMarketCardListing } from "@/core/entities/market/IMarketCardListing";
import { memo } from "react";

interface MarketListingsPanelProps {
  listings: IMarketCardListing[];
  onSelectCard: (listing: IMarketCardListing) => void;
}

function MarketListingsPanelComponent({ listings, onSelectCard }: MarketListingsPanelProps) {
  // Scroll nativo sin virtualización JS: el número de columnas y la altura los decide el propio CSS
  // grid (nunca hay desfase entre lo calculado y lo pintado). Con un catálogo de ~100 cartas no se
  // usa `content-visibility`: en móvil, al hacer scroll rápido, sus placeholders de tamaño intrínseco
  // aparecían como cajas grises antes de pintarse. El navegador ya hace su propio culling de pintado
  // y las imágenes son lazy (next/image), así que el scroll va fluido sin esos huecos grises.
  return (
    <section
      className="home-modern-scroll h-full min-h-0 overflow-y-auto overflow-x-hidden rounded-xl border border-cyan-800/35 bg-[#031020]/55 p-3 sm:p-4"
      style={{ scrollbarGutter: "stable" }}
    >
      <div className="grid w-full grid-cols-4 content-start justify-items-center gap-2 pb-6 sm:grid-cols-5 sm:gap-3 md:grid-cols-[repeat(auto-fill,minmax(90px,1fr))]">
        {listings.map((listing) => (
          <article
            key={listing.id}
            className={`relative w-full max-w-[88px] aspect-[5/7] rounded-lg border-2 sm:max-w-[96px] ${
              listing.isAvailable
                ? "border-cyan-900/60 bg-[#081220] hover:border-cyan-400/80 cursor-pointer shadow-[0_0_10px_rgba(34,211,238,0.1)]"
                : "border-zinc-800 bg-zinc-950/80 grayscale-[80%] opacity-60 cursor-pointer"
            } overflow-hidden transition-colors duration-200`}
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
                  <CardThumbnail card={listing.card} showArtSkeleton />
                </div>
              </div>
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}

/** Memoizado: seleccionar una carta no debe re-renderizar el grid completo de listados. */
export const MarketListingsPanel = memo(MarketListingsPanelComponent);
