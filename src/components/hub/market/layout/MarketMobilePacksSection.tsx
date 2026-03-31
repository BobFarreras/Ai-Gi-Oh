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
  tutorialCurrentStepId?: string | null;
  onSelectPack: (packId: string) => void;
  onBuyPack: (packId: string) => Promise<boolean>;
  onSelectPackCard: (listing: IMarketCardListing) => void;
}

export function MarketMobilePacksSection(props: MarketMobilePacksSectionProps) {
  const TUTORIAL_PRIMARY_PACK_ID = "tutorial-market-pack-gemgpt";
  const {
    packs,
    selectedPackId,
    packListings,
    isBuyingPack,
    tutorialCurrentStepId,
    onSelectPack,
    onBuyPack,
    onSelectPackCard,
  } = props;
  const [floatingSpendId, setFloatingSpendId] = useState(0);
  const floatingTimeoutRef = useRef<number | null>(null);
  const selectedPack = packs.find((pack) => pack.id === selectedPackId) ?? null;
  const isTutorialBuyStep = tutorialCurrentStepId === "market-buy-pack";
  const tutorialPrimaryPack = packs.find((pack) => pack.id === TUTORIAL_PRIMARY_PACK_ID) ?? packs[0] ?? null;
  const effectivePack = selectedPack ?? (isTutorialBuyStep ? tutorialPrimaryPack : null);
  const isBuyButtonEnabled = Boolean(effectivePack) && !isBuyingPack;

  useEffect(
    () => () => {
      if (floatingTimeoutRef.current === null) return;
      window.clearTimeout(floatingTimeoutRef.current);
    },
    [],
  );
  useEffect(() => {
    if (!isTutorialBuyStep || selectedPack || !tutorialPrimaryPack) return;
    onSelectPack(tutorialPrimaryPack.id);
  }, [isTutorialBuyStep, onSelectPack, selectedPack, tutorialPrimaryPack]);
  const handleBuyPack = async () => {
    if (!effectivePack || !isBuyButtonEnabled) return;
    const wasBought = await onBuyPack(effectivePack.id);
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
      <section data-tutorial-id="market-pack-selector" className="rounded-lg border border-cyan-800/35 bg-[#031020]/55 p-2">
        <div className="home-modern-scroll flex gap-2 overflow-x-auto pb-1">
          {packs.map((pack) => (
            <MarketPackCardTile
              key={pack.id}
              pack={pack}
              isSelected={selectedPackId === pack.id}
              onSelect={() => onSelectPack(pack.id)}
            />
          ))}
        </div>
      </section>

      <section data-tutorial-id="market-pack-preview" className="min-h-0 flex-1 overflow-hidden rounded-lg border border-cyan-800/35 bg-[#031020]/55">
        {selectedPackId ? (
          <MarketListingsPanel listings={packListings} isPerformanceMode={true} onSelectCard={onSelectPackCard} />
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
        data-tutorial-id="market-buy-pack"
        aria-label="Comprar pack seleccionado"
        disabled={!isBuyButtonEnabled}
        onClick={() => void handleBuyPack()}
        className="relative flex items-center justify-center gap-2 overflow-visible rounded-lg border border-fuchsia-500/55 bg-fuchsia-900/35 px-4 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-fuchsia-100 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {effectivePack ? (
          <MarketNexusSpendFloat amount={effectivePack.priceNexus} triggerId={floatingSpendId} className="right-2 top-1" />
        ) : null}
        <PackageOpen size={16} />
        {isBuyingPack ? "Procesando..." : effectivePack ? `Comprar x ${effectivePack.priceNexus} NX` : "Selecciona un Pack"}
      </button>
    </div>
  );
}
