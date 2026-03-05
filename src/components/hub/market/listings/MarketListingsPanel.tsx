// src/components/hub/market/listings/MarketListingsPanel.tsx - Grid de cartas de mercado con precio flotante y selección de detalle.
"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/game/card/Card";
import { IMarketCardListing } from "@/core/entities/market/IMarketCardListing";

interface MarketListingsPanelProps {
  listings: IMarketCardListing[];
  onSelectCard: (listing: IMarketCardListing) => void;
}

export function MarketListingsPanel({ listings, onSelectCard }: MarketListingsPanelProps) {
  return (
    <section className="home-modern-scroll h-full min-h-0 overflow-y-auto overflow-x-hidden rounded-xl border border-cyan-800/35 bg-[#031020]/55 p-3 sm:p-4">
      
      {/* REFACTOR CLAVE: auto-fill fluido, en vez de 5 columnas fijas */}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(90px,1fr))] content-start justify-items-center gap-3 w-full pb-6">
        {listings.map((listing) => (
          <motion.article
            key={listing.id}
            whileHover={{ y: -4, scale: 1.03 }}
            whileTap={{ scale: 0.95 }}
            className={`relative w-full max-w-[96px] aspect-[5/7] rounded-lg border-2 ${
              listing.isAvailable 
                ? "border-cyan-900/60 bg-[#081220] hover:border-cyan-400/80 cursor-pointer shadow-[0_0_10px_rgba(34,211,238,0.1)]" 
                : "border-zinc-800 bg-zinc-950/80 grayscale-[80%] opacity-60 cursor-pointer"
            } overflow-hidden transition-all duration-300`}
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
                <div className="scale-[0.30] origin-center">
                  <Card card={listing.card} />
                </div>
              </div>
            </button>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
