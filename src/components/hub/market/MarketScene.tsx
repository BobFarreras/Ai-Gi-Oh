// src/components/hub/market/MarketScene.tsx - Escena interactiva del mercado con filtros, compra y apertura de sobres.
"use client";

import { useMemo, useState } from "react";
import { MarketCardInspector } from "@/components/hub/market/MarketCardInspector";
import { MarketListingsPanel } from "@/components/hub/market/MarketListingsPanel";
import { MarketPackRevealOverlay } from "@/components/hub/market/MarketPackRevealOverlay";
import { MarketPacksPanel } from "@/components/hub/market/MarketPacksPanel";
import { MarketToolbar } from "@/components/hub/market/MarketToolbar";
import { MarketTransactionsPanel } from "@/components/hub/market/MarketTransactionsPanel";
import { buildMarketListingView } from "@/components/hub/market/market-listing-view";
import { MarketOrderDirection, MarketOrderField, MarketTypeFilter } from "@/components/hub/market/market-filters";
import { ICard } from "@/core/entities/ICard";
import { IMarketTransaction } from "@/core/entities/market/IMarketTransaction";
import { IMarketCatalog } from "@/core/use-cases/market/GetMarketCatalogUseCase";
import { buyMarketCardAction, buyPackAction, getMarketTransactionsAction } from "@/services/market/market-actions";

interface MarketSceneProps {
  playerId: string;
  initialCatalog: IMarketCatalog;
  initialTransactions: IMarketTransaction[];
}

export function MarketScene({ playerId, initialCatalog, initialTransactions }: MarketSceneProps) {
  const [catalog, setCatalog] = useState<IMarketCatalog>(initialCatalog);
  const [transactions, setTransactions] = useState<IMarketTransaction[]>(initialTransactions);
  const [selectedCard, setSelectedCard] = useState<ICard | null>(catalog.listings[0]?.card ?? null);
  const [nameQuery, setNameQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<MarketTypeFilter>("ALL");
  const [orderField, setOrderField] = useState<MarketOrderField>("PRICE");
  const [orderDirection, setOrderDirection] = useState<MarketOrderDirection>("ASC");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [revealedPackCards, setRevealedPackCards] = useState<ICard[]>([]);
  const [isPackRevealOpen, setIsPackRevealOpen] = useState(false);

  const visibleListings = useMemo(
    () => buildMarketListingView({ listings: catalog.listings, nameQuery, typeFilter, orderField, orderDirection }),
    [catalog.listings, nameQuery, orderDirection, orderField, typeFilter],
  );

  async function handleBuyCard(listingId: string): Promise<void> {
    try {
      const updatedCatalog = await buyMarketCardAction(playerId, listingId);
      const updatedTransactions = await getMarketTransactionsAction(playerId);
      setCatalog(updatedCatalog);
      setTransactions(updatedTransactions);
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "No se pudo comprar la carta.");
    }
  }

  async function handleBuyPack(packId: string): Promise<void> {
    try {
      const result = await buyPackAction(playerId, packId);
      const updatedTransactions = await getMarketTransactionsAction(playerId);
      setCatalog(result.catalog);
      setTransactions(updatedTransactions);
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
    <main className="hub-control-room-bg h-full overflow-hidden px-4 py-4 text-slate-100 sm:px-6">
      <section className="mx-auto flex h-full w-full max-w-[1700px] min-w-0 flex-col overflow-hidden rounded-3xl border border-cyan-900/40 bg-[#020a14]/88 p-4">
        <header className="flex items-end justify-between rounded-2xl border border-cyan-700/35 bg-[#041120]/90 px-5 py-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.34em] text-cyan-300/80">Nexus Market</p>
            <h1 className="text-3xl font-black uppercase tracking-wide text-cyan-100">Mercado</h1>
          </div>
          <p className="text-lg font-black uppercase text-cyan-200">Saldo: {catalog.wallet.nexus} Nexus</p>
        </header>
        {errorMessage && (
          <p className="mt-3 border border-rose-400/55 bg-rose-500/15 px-3 py-2 text-sm text-rose-100">{errorMessage}</p>
        )}
        <MarketToolbar
          nameQuery={nameQuery}
          typeFilter={typeFilter}
          orderField={orderField}
          orderDirection={orderDirection}
          onNameQueryChange={setNameQuery}
          onTypeFilterChange={setTypeFilter}
          onOrderFieldChange={setOrderField}
          onOrderDirectionToggle={() =>
            setOrderDirection((previous) => (previous === "ASC" ? "DESC" : "ASC"))
          }
        />
        <div className="mt-3 grid min-h-0 flex-1 gap-3 xl:grid-cols-[0.92fr_1.7fr_1.1fr]">
          <MarketCardInspector selectedCard={selectedCard} />
          <MarketListingsPanel
            listings={visibleListings}
            onSelectCard={(listing) => setSelectedCard(listing.card)}
            onBuyCard={handleBuyCard}
          />
          <div className="grid min-h-0 gap-3 grid-rows-[auto_1fr]">
            <MarketPacksPanel packs={catalog.packs} onBuyPack={handleBuyPack} />
            <MarketTransactionsPanel transactions={transactions} />
          </div>
        </div>
      </section>
      <MarketPackRevealOverlay cards={revealedPackCards} isOpen={isPackRevealOpen} onClose={() => setIsPackRevealOpen(false)} />
    </main>
  );
}
