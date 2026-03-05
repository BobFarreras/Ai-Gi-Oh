// src/components/hub/market/MarketScene.tsx
"use client";

import { useMemo, useState } from "react";
import { MarketCardInspector } from "@/components/hub/market/MarketCardInspector";
import { MarketListingsPanel } from "@/components/hub/market/MarketListingsPanel";
import { MarketPackRevealOverlay } from "@/components/hub/market/MarketPackRevealOverlay";
import { MarketPacksPanel } from "@/components/hub/market/MarketPacksPanel";
import { MarketVaultPanel } from "@/components/hub/market/MarketVaultPanel";
import { MarketHeaderBar } from "@/components/hub/market/MarketHeaderBar"; // <-- NUEVO COMPONENTE
import { buildMarketListingView } from "@/components/hub/market/market-listing-view";
import { useSyncSelectedListing } from "@/components/hub/market/internal/useSyncSelectedListing";
import { MarketOrderDirection, MarketOrderField, MarketTypeFilter } from "@/components/hub/market/market-filters";
import { ICard } from "@/core/entities/ICard";
import { ICollectionCard } from "@/core/entities/home/ICollectionCard";
import { IMarketCardListing } from "@/core/entities/market/IMarketCardListing";
import { IMarketTransaction } from "@/core/entities/market/IMarketTransaction";
import { IMarketCatalog } from "@/core/use-cases/market/GetMarketCatalogUseCase";
import {
  buyMarketCardAction,
  buyPackAction,
  getMarketTransactionsAction,
  getPlayerCollectionAction,
} from "@/services/market/market-actions";

interface MarketSceneProps {
  playerId: string;
  initialCatalog: IMarketCatalog;
  initialTransactions: IMarketTransaction[];
  initialCollection: ICollectionCard[];
}

export function MarketScene({ playerId, initialCatalog, initialTransactions, initialCollection }: MarketSceneProps) {
  const [catalog, setCatalog] = useState<IMarketCatalog>(initialCatalog);
  const [transactions, setTransactions] = useState<IMarketTransaction[]>(initialTransactions);
  const [collection, setCollection] = useState<ICollectionCard[]>(initialCollection);
  const [selectedPackId, setSelectedPackId] = useState<string | null>(catalog.packs[0]?.id ?? null);
  const [selectedListing, setSelectedListing] = useState<IMarketCardListing | null>(catalog.listings[0] ?? null);
  const [selectedCard, setSelectedCard] = useState<ICard | null>(catalog.listings[0]?.card ?? null);

  const [nameQuery, setNameQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<MarketTypeFilter>("ALL");
  const [orderField, setOrderField] = useState<MarketOrderField>("PRICE");
  const [orderDirection, setOrderDirection] = useState<MarketOrderDirection>("ASC");

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [revealedPackCards, setRevealedPackCards] = useState<ICard[]>([]);
  const [isPackRevealOpen, setIsPackRevealOpen] = useState(false);

  const scopedListings = useMemo(() => {
    if (!selectedPackId) return catalog.listings.filter((listing) => listing.isAvailable);
    const selectedPack = catalog.packs.find((pack) => pack.id === selectedPackId);
    if (!selectedPack) return catalog.listings.filter((listing) => listing.isAvailable);
    const previewSet = new Set(selectedPack.previewCardIds);
    return catalog.listings.filter((listing) => previewSet.has(listing.card.id));
  }, [catalog.listings, catalog.packs, selectedPackId]);

  const visibleListings = useMemo(
    () => buildMarketListingView({ listings: scopedListings, nameQuery, typeFilter, orderField, orderDirection }),
    [scopedListings, nameQuery, orderDirection, orderField, typeFilter],
  );
  useSyncSelectedListing({ selectedListing, visibleListings, setSelectedListing, setSelectedCard });

  async function handleBuyCard(listingId: string): Promise<void> {
    try {
      const updatedCatalog = await buyMarketCardAction(playerId, listingId);
      const updatedTransactions = await getMarketTransactionsAction(playerId);
      const updatedCollection = await getPlayerCollectionAction(playerId);
      setCatalog(updatedCatalog);
      setTransactions(updatedTransactions);
      setCollection(updatedCollection);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "No se pudo comprar la carta.");
    }
  }

  async function handleBuyPack(packId: string): Promise<void> {
    try {
      const result = await buyPackAction(playerId, packId);
      const updatedTransactions = await getMarketTransactionsAction(playerId);
      const updatedCollection = await getPlayerCollectionAction(playerId);
      setCatalog(result.catalog);
      setTransactions(updatedTransactions);
      setCollection(updatedCollection);
      const cardMap = new Map(result.catalog.listings.map((listing) => [listing.card.id, listing.card]));
      const openedCards = result.openedCardIds
        .map((cardId) => cardMap.get(cardId))
        .filter((card): card is ICard => Boolean(card));
      setRevealedPackCards(openedCards);
      setIsPackRevealOpen(true);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "No se pudo comprar el sobre.");
    }
  }

  return (
    <main className="hub-control-room-bg relative box-border w-full h-[100dvh] overflow-hidden px-3 py-3 text-slate-100 sm:px-5 flex flex-col justify-center items-center">
      <section className="mx-auto flex h-full max-h-[95dvh] w-full max-w-screen-2xl min-w-0 flex-col overflow-hidden rounded-3xl border border-cyan-900/40 bg-[#020a14]/88 p-3 shadow-[0_24px_50px_rgba(2,5,14,0.86)] backdrop-blur-xl sm:p-4 transition-all">

        {/* REFACTOR: Inyección Limpia del Header Bar */}
        <MarketHeaderBar
          walletBalance={catalog.wallet.nexus}
          nameQuery={nameQuery}
          typeFilter={typeFilter}
          orderField={orderField}
          orderDirection={orderDirection}
          onNameQueryChange={setNameQuery}
          onTypeFilterChange={setTypeFilter}
          onOrderFieldChange={setOrderField}
          onOrderDirectionToggle={() => setOrderDirection((previous) => (previous === "ASC" ? "DESC" : "ASC"))}
        />

        {errorMessage && (
          <div className="mt-3 shrink-0 animate-in fade-in slide-in-from-top-2">
            <p className="rounded-xl border border-rose-500/50 bg-rose-950/40 px-4 py-3 text-sm font-bold text-rose-200 shadow-[0_0_15px_rgba(239,68,68,0.2)] text-center tracking-wide">
              {errorMessage}
            </p>
          </div>
        )}

        <div className="mt-4 grid min-h-0 flex-1 gap-4 xl:grid-cols-[1fr_1.8fr_1.2fr]">
          <div className="min-h-0 min-w-0 overflow-hidden rounded-xl bg-black/40 border border-cyan-900/30 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
            <MarketCardInspector selectedCard={selectedCard} selectedListing={selectedListing} onBuyCard={handleBuyCard} />
          </div>

          <div className="min-h-0 min-w-0 overflow-hidden rounded-xl bg-black/40 border border-cyan-900/30 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
            <MarketListingsPanel
              listings={visibleListings}
              onSelectCard={(listing) => {
                setSelectedListing(listing);
                setSelectedCard(listing.card);
              }}
            />
          </div>

          <div className="grid min-h-0 gap-4 grid-rows-[auto_1fr] min-w-0 overflow-hidden">
            <div className="min-h-0 min-w-0 overflow-hidden rounded-xl bg-black/40 border border-cyan-900/30 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
              <MarketPacksPanel
                packs={catalog.packs}
                selectedPackId={selectedPackId}
                onSelectPack={setSelectedPackId}
                onClearPackSelection={() => setSelectedPackId(null)}
                onBuyPack={handleBuyPack}
              />
            </div>
            <div className="min-h-0 min-w-0 overflow-hidden rounded-xl bg-black/40 border border-cyan-900/30 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">



                {/* REFACTOR CLAVE: Añadido 'h-full flex flex-col' al div padre */}
                <div className="min-h-0 min-w-0 h-full flex flex-col overflow-hidden rounded-xl bg-black/40 border border-cyan-900/30 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">

                  <MarketVaultPanel
                    collection={collection}
                    transactions={transactions}
                    catalogListings={catalog.listings}
                    onSelectCard={(card) => {
                      const listing = catalog.listings.find(l => l.card.id === card.id) || null;

                      setNameQuery("");
                      setTypeFilter("ALL");

                      if (listing && !listing.isAvailable) {
                        const pack = catalog.packs.find(p => p.previewCardIds.includes(card.id));
                        if (pack) setSelectedPackId(pack.id);
                        else setSelectedPackId(null);
                      } else {
                        setSelectedPackId(null);
                      }

                      setSelectedListing(listing);
                      setSelectedCard(card);
                    }}
                  />

                </div>
              </div>
            
          </div>
        </div>
      </section>

      <MarketPackRevealOverlay
        cards={revealedPackCards}
        isOpen={isPackRevealOpen}
        onClose={() => setIsPackRevealOpen(false)}
      />
    </main>
  );
}