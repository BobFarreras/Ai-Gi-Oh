// src/components/hub/market/layout/MarketMobilePacksSection.tsx - Flujo mobile de packs con selector, cartas del sobre y compra al pie.
"use client";

import { useEffect } from "react";
import { PackageOpen } from "lucide-react";
import { MarketListingsPanel } from "@/components/hub/market/listings/MarketListingsPanel";
import { IMarketCardListing } from "@/core/entities/market/IMarketCardListing";
import { MarketPackCardTile } from "@/components/hub/market/packs/MarketPackCardTile";
import { IMarketPackDefinition } from "@/core/entities/market/IMarketPackDefinition";

interface MarketMobilePacksSectionProps {
  packs: IMarketPackDefinition[];
  selectedPackId: string | null;
  packListings: IMarketCardListing[];
  isBuyingPack: boolean;
  onSelectPack: (packId: string) => void;
  onBuyPack: (packId: string) => Promise<void>;
  onSelectPackCard: (listing: IMarketCardListing) => void;
}

export function MarketMobilePacksSection(props: MarketMobilePacksSectionProps) {
  const { packs, selectedPackId, onSelectPack } = props;
  const selectedPack = props.packs.find((pack) => pack.id === props.selectedPackId) ?? null;

  useEffect(() => {
    if (selectedPackId) return;
    const firstPack = packs[0];
    if (firstPack) onSelectPack(firstPack.id);
  }, [onSelectPack, packs, selectedPackId]);

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 p-3">
      <section className="rounded-lg border border-cyan-800/35 bg-[#031020]/55 p-2">
        <div className="home-modern-scroll flex gap-2 overflow-x-auto pb-1">
          {props.packs.map((pack) => (
            <MarketPackCardTile
              key={pack.id}
              pack={pack}
              isSelected={props.selectedPackId === pack.id}
              onSelect={() => props.onSelectPack(pack.id)}
            />
          ))}
        </div>
      </section>

      <section className="min-h-0 flex-1 overflow-hidden rounded-lg border border-cyan-800/35 bg-[#031020]/55">
        <MarketListingsPanel listings={props.packListings} onSelectCard={props.onSelectPackCard} />
      </section>

      <button
        type="button"
        aria-label="Comprar pack seleccionado"
        disabled={!selectedPack || props.isBuyingPack}
        onClick={() => selectedPack && props.onBuyPack(selectedPack.id)}
        className="flex items-center justify-center gap-2 rounded-lg border border-fuchsia-500/55 bg-fuchsia-900/35 px-4 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-fuchsia-100 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <PackageOpen size={16} />
        {props.isBuyingPack ? "Procesando..." : selectedPack ? `Comprar x ${selectedPack.priceNexus} NX` : "Selecciona un Pack"}
      </button>
    </div>
  );
}
