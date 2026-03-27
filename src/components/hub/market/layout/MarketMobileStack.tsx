// src/components/hub/market/layout/MarketMobileStack.tsx - Layout móvil del mercado con paneles conmutables por pestañas.
"use client";

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
import { useMarketMobileStackState } from "@/components/hub/market/layout/internal/use-market-mobile-stack-state";

export type MobilePanel = "LISTINGS" | "PACKS" | "VAULT";

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
  onTutorialBuyPack?: () => void;
  onVaultTabChange?: (tab: "COLLECTION" | "HISTORY") => void;
  tutorialForcedPanel?: MobilePanel | null;
  tutorialForceInspectorOpen?: boolean;
  tutorialCurrentStepId?: string | null;
}

const PANEL_TABS: Array<{ id: MobilePanel; label: string }> = [
  { id: "LISTINGS", label: "Mercado" },
  { id: "PACKS", label: "Packs" },
  { id: "VAULT", label: "Almacén" },
];

export function MarketMobileStack(props: MarketMobileStackProps) {
  const inspectorOrigin = { x: 0, y: 0 };
  const { play } = useHubModuleSfx();
  const state = useMarketMobileStackState({
    tutorialForcedPanel: props.tutorialForcedPanel,
    tutorialForceInspectorOpen: props.tutorialForceInspectorOpen,
    tutorialCurrentStepId: props.tutorialCurrentStepId,
    packs: props.packs,
    selectedPackId: props.selectedPackId,
    catalogListings: props.catalogListings,
    onShowFreeListings: props.onShowFreeListings,
    onSelectListing: props.onSelectListing,
    onSelectVaultCard: props.onSelectVaultCard,
    playSfx: play,
  });
  return (
    <div className="mt-4 flex min-h-0 flex-1 flex-col gap-3">
      <nav data-tutorial-id="market-mobile-sections-tabs" aria-label="Paneles del mercado" className="home-modern-scroll flex gap-2 overflow-x-auto pb-1">
        {PANEL_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            data-tutorial-id={`market-mobile-tab-${tab.id.toLowerCase()}`}
            aria-label={`Mostrar ${tab.label}`}
            onClick={() => {
              state.switchPanel(tab.id);
            }}
            className={cn(
              "shrink-0 rounded-lg border px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] transition-all",
              state.effectiveActivePanel === tab.id
                ? "border-cyan-400 bg-cyan-950/70 text-cyan-100 shadow-[0_0_14px_rgba(34,211,238,0.25)]"
                : "border-cyan-900/40 bg-[#02101f]/70 text-cyan-400/75",
            )}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <div className="min-h-0 flex-1 overflow-hidden rounded-xl border border-cyan-900/30 bg-black/40 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
        {state.visitedPanels.LISTINGS || state.effectiveActivePanel === "LISTINGS" ? (
          <div className={state.effectiveActivePanel === "LISTINGS" ? "h-full" : "hidden"}>
            <MarketListingsPanel listings={props.listings} isPerformanceMode={true} onSelectCard={state.handleSelectListing} />
          </div>
        ) : null}
        {state.visitedPanels.PACKS || state.effectiveActivePanel === "PACKS" ? (
          <div className={state.effectiveActivePanel === "PACKS" ? "h-full" : "hidden"}>
            <MarketMobilePacksSection
              packs={props.packs}
              selectedPackId={state.effectiveSelectedPackId}
              packListings={state.packListings}
              isBuyingPack={props.isBuyingPack}
              tutorialCurrentStepId={props.tutorialCurrentStepId}
              onSelectPack={props.onSelectPack}
              onBuyPack={async (packId) => {
                const wasBought = await props.onBuyPack(packId);
                if (wasBought) props.onTutorialBuyPack?.();
                return wasBought;
              }}
              onSelectPackCard={state.handleSelectListing}
            />
          </div>
        ) : null}
        {state.visitedPanels.VAULT || state.effectiveActivePanel === "VAULT" ? (
          <div className={state.effectiveActivePanel === "VAULT" ? "h-full" : "hidden"}>
            <MarketVaultPanel
              collection={props.collection}
              transactions={props.transactions}
              catalogListings={props.catalogListings}
              isPerformanceMode={true}
              onActiveTabChange={props.onVaultTabChange}
              onSelectCard={state.handleSelectVaultCard}
            />
          </div>
        ) : null}
      </div>

      <MobileInspectorDialogShell
        isOpen={state.isInspectorOpenEffective}
        origin={inspectorOrigin}
        disableMotion
        onClose={state.closeInspector}
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
