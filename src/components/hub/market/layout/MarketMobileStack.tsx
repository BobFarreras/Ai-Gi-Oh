// src/components/hub/market/layout/MarketMobileStack.tsx - Layout móvil del mercado con paneles conmutables por pestañas.
"use client";

import { startTransition, useMemo, useState } from "react";
import { MarketCardInspector } from "@/components/hub/market/MarketCardInspector";
import { MobileInspectorDialogShell } from "@/components/hub/internal/MobileInspectorDialogShell";
import { MarketListingsPanel } from "@/components/hub/market/listings/MarketListingsPanel";
import { MarketVaultPanel } from "@/components/hub/market/vault/MarketVaultPanel";
import { MarketMobilePacksSection } from "@/components/hub/market/layout/MarketMobilePacksSection";
import { useHubModuleSfx } from "@/components/hub/internal/use-hub-module-sfx";
import { ICard } from "@/core/entities/ICard";
import { ICollectionCard } from "@/core/entities/home/ICollectionCard";
import { IMarketCardListing } from "@/core/entities/market/IMarketCardListing";
import { IMarketPackDefinition } from "@/core/entities/market/IMarketPackDefinition";
import { IMarketTransaction } from "@/core/entities/market/IMarketTransaction";
import { cn } from "@/lib/utils";

type MobilePanel = "LISTINGS" | "PACKS" | "VAULT";

interface MarketMobileStackProps {
  selectedCard: ICard | null;
  selectedListing: IMarketCardListing | null;
  listings: IMarketCardListing[];
  packs: IMarketPackDefinition[];
  selectedPackId: string | null;
  collection: ICollectionCard[];
  transactions: IMarketTransaction[];
  catalogListings: IMarketCardListing[];
  isBuyingPack: boolean;
  onBuyCard: (listingId: string) => Promise<boolean>;
  onBuyPack: (packId: string) => Promise<boolean>;
  onSelectPack: (packId: string) => void;
  onShowFreeListings: () => void;
  onSelectListing: (listing: IMarketCardListing) => void;
  onSelectVaultCard: (card: ICard) => void;
}

const PANEL_TABS: Array<{ id: MobilePanel; label: string }> = [
  { id: "LISTINGS", label: "Mercado" },
  { id: "PACKS", label: "Packs" },
  { id: "VAULT", label: "Almacén" },
];

export function MarketMobileStack(props: MarketMobileStackProps) {
  const [activePanel, setActivePanel] = useState<MobilePanel>("LISTINGS");
  const [visitedPanels, setVisitedPanels] = useState<Record<MobilePanel, boolean>>({
    LISTINGS: true,
    PACKS: false,
    VAULT: false,
  });
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const inspectorOrigin = { x: 0, y: 0 };
  const { play } = useHubModuleSfx();
  const packListings = useMemo(() => {
    if (!props.selectedPackId) return [];
    const selectedPack = props.packs.find((pack) => pack.id === props.selectedPackId);
    if (!selectedPack) return [];
    const packCardIds = new Set(selectedPack.previewCardIds);
    return props.catalogListings.filter((listing) => packCardIds.has(listing.card.id));
  }, [props.catalogListings, props.packs, props.selectedPackId]);

  const handleSelectListing = (listing: IMarketCardListing) => {
    props.onSelectListing(listing);
    setIsInspectorOpen(true);
    window.requestAnimationFrame(() => play("DETAIL_OPEN"));
  };
  const handleSelectVaultCard = (card: ICard) => {
    props.onSelectVaultCard(card);
    setIsInspectorOpen(true);
    window.requestAnimationFrame(() => play("DETAIL_OPEN"));
  };

  const markPanelAsVisited = (panel: MobilePanel) => {
    setVisitedPanels((previous) => (previous[panel] ? previous : { ...previous, [panel]: true }));
  };

  return (
    <div className="mt-4 flex min-h-0 flex-1 flex-col gap-3 xl:hidden">
      <nav aria-label="Paneles del mercado" className="home-modern-scroll flex gap-2 overflow-x-auto pb-1">
        {PANEL_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            aria-label={`Mostrar ${tab.label}`}
            onClick={() => {
              if (activePanel !== tab.id) play("SECTION_SWITCH");
              setActivePanel(tab.id);
              markPanelAsVisited(tab.id);
              if (tab.id === "LISTINGS") {
                startTransition(() => {
                  props.onShowFreeListings();
                });
              }
            }}
            className={cn(
              "shrink-0 rounded-lg border px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] transition-all",
              activePanel === tab.id
                ? "border-cyan-400 bg-cyan-950/70 text-cyan-100 shadow-[0_0_14px_rgba(34,211,238,0.25)]"
                : "border-cyan-900/40 bg-[#02101f]/70 text-cyan-400/75",
            )}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <div className="min-h-0 flex-1 overflow-hidden rounded-xl border border-cyan-900/30 bg-black/40 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
        {visitedPanels.LISTINGS ? (
          <div className={activePanel === "LISTINGS" ? "h-full" : "hidden"}>
            <MarketListingsPanel listings={props.listings} isPerformanceMode={true} onSelectCard={handleSelectListing} />
          </div>
        ) : null}
        {visitedPanels.PACKS ? (
          <div className={activePanel === "PACKS" ? "h-full" : "hidden"}>
            <MarketMobilePacksSection
              packs={props.packs}
              selectedPackId={props.selectedPackId}
              packListings={packListings}
              isBuyingPack={props.isBuyingPack}
              onSelectPack={props.onSelectPack}
              onBuyPack={props.onBuyPack}
              onSelectPackCard={handleSelectListing}
            />
          </div>
        ) : null}
        {visitedPanels.VAULT ? (
          <div className={activePanel === "VAULT" ? "h-full" : "hidden"}>
            <MarketVaultPanel
              collection={props.collection}
              transactions={props.transactions}
              catalogListings={props.catalogListings}
              isPerformanceMode={true}
              onSelectCard={handleSelectVaultCard}
            />
          </div>
        ) : null}
      </div>

      <MobileInspectorDialogShell
        isOpen={isInspectorOpen}
        origin={inspectorOrigin}
        disableMotion
        onClose={() => setIsInspectorOpen(false)}
        onRequestClose={(source) => {
          if (source === "button") play("DIALOG_CLOSE");
        }}
        closeAriaLabel="Cerrar inspección"
        overlayTopClassName="top-[74px]"
        panelTopClassName="top-[78px]"
      >
        <MarketCardInspector
          selectedCard={props.selectedCard}
          selectedListing={props.selectedListing}
          isCompactMode
          onBuyCard={props.onBuyCard}
        />
      </MobileInspectorDialogShell>
    </div>
  );
}
