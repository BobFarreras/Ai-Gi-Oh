// src/components/hub/market/packs/MarketPackCardTile.tsx - Tarjeta visual individual para seleccionar un sobre del mercado.
"use client";

import { PackageOpen } from "lucide-react";
import { Card } from "@/components/game/card/Card";
import { MOSAIC_CARDS, MOSAIC_POSITIONS } from "@/components/hub/market/internal/pack-mosaic-cards";
import { IMarketPackDefinition } from "@/core/entities/market/IMarketPackDefinition";

interface MarketPackCardTileProps {
  pack: IMarketPackDefinition;
  isSelected: boolean;
  onSelect: () => void;
}

export function MarketPackCardTile({ pack, isSelected, onSelect }: MarketPackCardTileProps) {
  return (
    <button
      type="button"
      aria-label={`Seleccionar ${pack.name}`}
      onClick={onSelect}
      className={`relative z-10 aspect-[3/4] w-[100px] shrink-0 overflow-hidden rounded-lg border-2 text-left transition-all duration-300 sm:w-[110px] ${
        isSelected
          ? "z-20 scale-[1.02] border-fuchsia-400 shadow-[0_0_20px_rgba(192,38,211,0.6)]"
          : "border-cyan-800/60 shadow-lg hover:border-cyan-400 hover:shadow-[0_0_15px_rgba(34,211,238,0.3)]"
      }`}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-lg bg-[#01060d]">
        <div className="absolute inset-0 z-0">
          {MOSAIC_POSITIONS.map((position, index) => (
            <div key={position} className={`absolute h-[340px] w-[260px] origin-top-left scale-[0.20] opacity-100 ${position}`}>
              <Card card={MOSAIC_CARDS[index]} />
            </div>
          ))}
        </div>
        <div className={`absolute inset-0 z-10 transition-colors duration-500 ${isSelected ? "bg-fuchsia-600/20" : "bg-cyan-900/30"}`} />
        <div className="absolute inset-0 z-20 bg-gradient-to-t from-black/90 via-black/20 to-transparent backdrop-blur-[0.5px]" />
      </div>

      <div className="relative z-30 flex h-full flex-col justify-between p-2">
        <div className="mx-1 mt-1 rounded border border-white/10 bg-black/60 py-0.5 text-center shadow-lg backdrop-blur-md">
          <p className={`text-[8px] font-black uppercase tracking-widest ${isSelected ? "text-fuchsia-300" : "text-cyan-300"}`}>
            {pack.cardsPerPack} Datos
          </p>
        </div>

        <div className="mt-2 flex flex-col items-center justify-center">
          <div className={`rounded-full border bg-black/30 p-2 backdrop-blur-sm ${isSelected ? "border-fuchsia-400/50" : "border-cyan-400/30"}`}>
            <PackageOpen
              size={20}
              className={isSelected ? "text-fuchsia-300 drop-shadow-[0_0_8px_rgba(192,38,211,0.8)]" : "text-cyan-300"}
            />
          </div>
          <h3 className="mt-2 rounded bg-black/50 px-2 py-1 text-center text-[11px] font-black uppercase leading-tight text-white shadow-[0_2px_4px_rgba(0,0,0,0.8)] backdrop-blur-sm">
            {pack.name}
          </h3>
        </div>

        <div className={`-mx-2 mt-auto border-t bg-black/80 py-1.5 text-center shadow-[0_-5px_15px_rgba(0,0,0,0.6)] backdrop-blur-md ${isSelected ? "border-fuchsia-500/80" : "border-cyan-800/80"}`}>
          <p className="text-[10px] font-black tracking-widest text-emerald-400 drop-shadow-[0_0_5px_rgba(16,185,129,0.5)]">
            {pack.priceNexus} NX
          </p>
        </div>
      </div>
    </button>
  );
}
