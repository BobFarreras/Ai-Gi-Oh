// src/components/hub/market/layout/MarketMobilePacksSection.tsx - Flujo mobile de packs con selector, cartas del sobre y compra al pie.
"use client";

import { useEffect, useRef, useState } from "react";
import { PackageOpen } from "lucide-react";
import { MarketListingsPanel } from "@/components/hub/market/listings/MarketListingsPanel";
import { IMarketCardListing } from "@/core/entities/market/IMarketCardListing";
import { MarketPackCardTile } from "@/components/hub/market/packs/MarketPackCardTile";
import { MarketNexusSpendFloat } from "@/components/hub/market/internal/MarketNexusSpendFloat";
import { IMarketPackDefinition } from "@/core/entities/market/IMarketPackDefinition";

interface MarketMobilePacksSectionProps {
  packs: IMarketPackDefinition[];
  selectedPackId: string | null;
  packListings: IMarketCardListing[];
  isBuyingPack: boolean;
  onSelectPack: (packId: string) => void;
  onBuyPack: (packId: string) => Promise<boolean>;
  onSelectPackCard: (listing: IMarketCardListing) => void;
}

export function MarketMobilePacksSection(props: MarketMobilePacksSectionProps) {
  const [floatingSpendId, setFloatingSpendId] = useState(0);
  const floatingTimeoutRef = useRef<number | null>(null);
  const selectedPack = props.packs.find((pack) => pack.id === props.selectedPackId) ?? null;

  useEffect(
    () => () => {
      if (floatingTimeoutRef.current === null) return;
      window.clearTimeout(floatingTimeoutRef.current);
    },
    [],
  );
  const handleBuyPack = async () => {
    if (!selectedPack || props.isBuyingPack) return;
    const wasBought = await props.onBuyPack(selectedPack.id);
    if (!wasBought) return;
    setFloatingSpendId((previous) => previous + 1);
    if (floatingTimeoutRef.current !== null) window.clearTimeout(floatingTimeoutRef.current);
    floatingTimeoutRef.current = window.setTimeout(() => {
      setFloatingSpendId(0);
      floatingTimeoutRef.current = null;
    }, 1280);
  };

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
        {props.selectedPackId ? (
          <MarketListingsPanel listings={props.packListings} isPerformanceMode={true} onSelectCard={props.onSelectPackCard} />
        ) : (
          <div className="flex h-full items-center justify-center text-center">
            <p className="px-4 text-xs font-black uppercase tracking-[0.16em] text-cyan-300/80">
              Selecciona un pack para ver su contenido.
            </p>
          </div>
        )}
      </section>

      <button
        type="button"
        aria-label="Comprar pack seleccionado"
        disabled={!selectedPack || props.isBuyingPack}
        onClick={() => void handleBuyPack()}
        className="relative flex items-center justify-center gap-2 overflow-visible rounded-lg border border-fuchsia-500/55 bg-fuchsia-900/35 px-4 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-fuchsia-100 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {selectedPack ? (
          <MarketNexusSpendFloat amount={selectedPack.priceNexus} triggerId={floatingSpendId} className="right-2 top-1" />
        ) : null}
        <PackageOpen size={16} />
        {props.isBuyingPack ? "Procesando..." : selectedPack ? `Comprar x ${selectedPack.priceNexus} NX` : "Selecciona un Pack"}
      </button>
    </div>
  );
}
