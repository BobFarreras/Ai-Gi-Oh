// src/components/hub/market/layout/MarketDesktopGrid.tsx - Distribución de tres paneles del mercado para escritorio.
"use client";

import { MarketCardInspector } from "@/components/hub/market/MarketCardInspector";
import { MarketListingsPanel } from "@/components/hub/market/listings/MarketListingsPanel";
import { MarketPacksPanel } from "@/components/hub/market/packs/MarketPacksPanel";
import { MarketVaultPanel } from "@/components/hub/market/vault/MarketVaultPanel";
import { useHubModuleSfx } from "@/components/hub/internal/use-hub-module-sfx";
import { ICard } from "@/core/entities/ICard";
import { ICollectionCard } from "@/core/entities/home/ICollectionCard";
import { IMarketCardListing } from "@/core/entities/market/IMarketCardListing";
import { IMarketPackDefinition } from "@/core/entities/market/IMarketPackDefinition";
import { IMarketTransaction } from "@/core/entities/market/IMarketTransaction";

interface MarketDesktopGridProps {
  selectedCard: ICard | null;
  selectedListing: IMarketCardListing | null;
  listings: IMarketCardListing[];
  packs: IMarketPackDefinition[];
  selectedPackId: string | null;
  collection: ICollectionCard[];
  transactions: IMarketTransaction[];
  catalogListings: IMarketCardListing[];
  onBuyCard: (listingId: string) => Promise<boolean>;
  onBuyPack: (packId: string) => Promise<boolean>;
  onSelectPack: (packId: string) => void;
  onClearPackSelection: () => void;
  onSelectListing: (listing: IMarketCardListing) => void;
  onSelectVaultCard: (card: ICard) => void;
}

export function MarketDesktopGrid(props: MarketDesktopGridProps) {
  const { play } = useHubModuleSfx();

  return (
    <div className="mt-4 hidden min-h-0 flex-1 gap-4 xl:grid xl:grid-cols-[1fr_1.8fr_1.2fr]">
      <div className="min-h-0 min-w-0 overflow-hidden rounded-xl border border-cyan-900/30 bg-black/40 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
        <MarketCardInspector
          selectedCard={props.selectedCard}
          selectedListing={props.selectedListing}
          onBuyCard={props.onBuyCard}
        />
      </div>

      <div className="min-h-0 min-w-0 overflow-hidden rounded-xl border border-cyan-900/30 bg-black/40 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
        <MarketListingsPanel
          listings={props.listings}
          isPerformanceMode={false}
          onSelectCard={(listing) => {
            play("DETAIL_OPEN");
            props.onSelectListing(listing);
          }}
        />
      </div>

      <div className="grid min-h-0 min-w-0 grid-rows-[auto_1fr] gap-4 overflow-hidden">
        <div className="min-h-0 min-w-0 overflow-hidden rounded-xl border border-cyan-900/30 bg-black/40 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
          <MarketPacksPanel
            packs={props.packs}
            selectedPackId={props.selectedPackId}
            onSelectPack={props.onSelectPack}
            onClearPackSelection={props.onClearPackSelection}
            onBuyPack={props.onBuyPack}
          />
        </div>
        <div className="min-h-0 min-w-0 overflow-hidden rounded-xl border border-cyan-900/30 bg-black/40 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
          <MarketVaultPanel
            collection={props.collection}
            transactions={props.transactions}
            catalogListings={props.catalogListings}
            isPerformanceMode={false}
            onSelectCard={(card) => {
              play("DETAIL_OPEN");
              props.onSelectVaultCard(card);
            }}
          />
        </div>
      </div>
    </div>
  );
}
