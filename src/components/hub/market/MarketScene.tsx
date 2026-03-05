// src/components/hub/market/MarketScene.tsx - Orquesta la UI del mercado usando paneles modulares y estado desacoplado.
"use client";

import { MarketCardInspector } from "@/components/hub/market/MarketCardInspector";
import { MarketHeaderBar } from "@/components/hub/market/layout/MarketHeaderBar";
import { MarketListingsPanel } from "@/components/hub/market/listings/MarketListingsPanel";
import { MarketPacksPanel } from "@/components/hub/market/packs/MarketPacksPanel";
import { MarketPackRevealOverlay } from "@/components/hub/market/reveal/MarketPackRevealOverlay";
import { MarketVaultPanel } from "@/components/hub/market/vault/MarketVaultPanel";
import { useMarketSceneState } from "@/components/hub/market/internal/useMarketSceneState";
import { ICollectionCard } from "@/core/entities/home/ICollectionCard";
import { IMarketTransaction } from "@/core/entities/market/IMarketTransaction";
import { IMarketCatalog } from "@/core/use-cases/market/GetMarketCatalogUseCase";

interface MarketSceneProps {
  playerId: string;
  initialCatalog: IMarketCatalog;
  initialTransactions: IMarketTransaction[];
  initialCollection: ICollectionCard[];
}

export function MarketScene(props: MarketSceneProps) {
  const state = useMarketSceneState(props);

  return (
    <main className="hub-control-room-bg relative box-border flex h-[100dvh] w-full flex-col items-center justify-center overflow-hidden px-3 py-3 text-slate-100 sm:px-5">
      <section className="mx-auto flex h-full max-h-[95dvh] w-full max-w-screen-2xl min-w-0 flex-col overflow-hidden rounded-3xl border border-cyan-900/40 bg-[#020a14]/88 p-3 shadow-[0_24px_50px_rgba(2,5,14,0.86)] backdrop-blur-xl transition-all sm:p-4">
        <MarketHeaderBar
          walletBalance={state.catalog.wallet.nexus}
          nameQuery={state.nameQuery}
          typeFilter={state.typeFilter}
          orderField={state.orderField}
          orderDirection={state.orderDirection}
          onNameQueryChange={state.setNameQuery}
          onTypeFilterChange={state.setTypeFilter}
          onOrderFieldChange={state.setOrderField}
          onOrderDirectionToggle={() =>
            state.setOrderDirection((previous) => (previous === "ASC" ? "DESC" : "ASC"))
          }
        />

        {state.errorMessage && (
          <div className="mt-3 shrink-0 animate-in fade-in slide-in-from-top-2">
            <p className="rounded-xl border border-rose-500/50 bg-rose-950/40 px-4 py-3 text-center text-sm font-bold tracking-wide text-rose-200 shadow-[0_0_15px_rgba(239,68,68,0.2)]">
              {state.errorMessage}
            </p>
          </div>
        )}

        <div className="mt-4 grid min-h-0 flex-1 gap-4 xl:grid-cols-[1fr_1.8fr_1.2fr]">
          <div className="min-h-0 min-w-0 overflow-hidden rounded-xl border border-cyan-900/30 bg-black/40 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
            <MarketCardInspector
              selectedCard={state.selectedCard}
              selectedListing={state.selectedListing}
              onBuyCard={state.handleBuyCard}
            />
          </div>

          <div className="min-h-0 min-w-0 overflow-hidden rounded-xl border border-cyan-900/30 bg-black/40 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
            <MarketListingsPanel
              listings={state.visibleListings}
              onSelectCard={(listing) => {
                state.setSelectedListing(listing);
                state.setSelectedCard(listing.card);
              }}
            />
          </div>

          <div className="grid min-h-0 min-w-0 grid-rows-[auto_1fr] gap-4 overflow-hidden">
            <div className="min-h-0 min-w-0 overflow-hidden rounded-xl border border-cyan-900/30 bg-black/40 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
              <MarketPacksPanel
                packs={state.catalog.packs}
                selectedPackId={state.selectedPackId}
                onSelectPack={state.setSelectedPackId}
                onClearPackSelection={() => state.setSelectedPackId(null)}
                onBuyPack={state.handleBuyPack}
              />
            </div>
            <div className="min-h-0 min-w-0 overflow-hidden rounded-xl border border-cyan-900/30 bg-black/40 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
              <MarketVaultPanel
                collection={state.collection}
                transactions={state.transactions}
                catalogListings={state.catalog.listings}
                onSelectCard={(card) => {
                  const listing = state.catalog.listings.find((currentListing) => currentListing.card.id === card.id) ?? null;
                  state.setNameQuery("");
                  state.setTypeFilter("ALL");
                  if (!listing) {
                    state.setSelectedPackId(null);
                  } else if (!listing.isAvailable) {
                    const matchingPack = state.catalog.packs.find((pack) => pack.previewCardIds.includes(card.id));
                    state.setSelectedPackId(matchingPack?.id ?? null);
                  } else {
                    state.setSelectedPackId(null);
                  }
                  state.setSelectedListing(listing);
                  state.setSelectedCard(card);
                }}
              />
            </div>
          </div>
        </div>
      </section>

      <MarketPackRevealOverlay
        cards={state.revealedPackCards}
        isOpen={state.isPackRevealOpen}
        onClose={() => state.setIsPackRevealOpen(false)}
      />
    </main>
  );
}
