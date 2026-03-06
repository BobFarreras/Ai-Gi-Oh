// src/components/hub/market/internal/useMarketSceneState.ts - Encapsula estado y acciones del MarketScene para reducir complejidad del componente.
"use client";

import { useMemo, useState } from "react";
import { buildMarketListingView } from "@/components/hub/market/market-listing-view";
import { applyOptimisticBuyCard } from "@/components/hub/market/internal/optimistic-market-updates";
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
} from "@/services/market/market-actions";

interface UseMarketSceneStateInput {
  playerId: string;
  initialCatalog: IMarketCatalog;
  initialTransactions: IMarketTransaction[];
  initialCollection: ICollectionCard[];
}

export function useMarketSceneState(input: UseMarketSceneStateInput) {
  const [catalog, setCatalog] = useState<IMarketCatalog>(input.initialCatalog);
  const [transactions, setTransactions] = useState<IMarketTransaction[]>(input.initialTransactions);
  const [collection, setCollection] = useState<ICollectionCard[]>(input.initialCollection);
  const [selectedPackId, setSelectedPackId] = useState<string | null>(input.initialCatalog.packs[0]?.id ?? null);
  const [selectedListing, setSelectedListing] = useState<IMarketCardListing | null>(input.initialCatalog.listings[0] ?? null);
  const [selectedCard, setSelectedCard] = useState<ICard | null>(input.initialCatalog.listings[0]?.card ?? null);
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
    () =>
      buildMarketListingView({
        listings: scopedListings,
        nameQuery,
        typeFilter,
        orderField,
        orderDirection,
      }),
    [nameQuery, orderDirection, orderField, scopedListings, typeFilter],
  );

  useSyncSelectedListing({ selectedListing, visibleListings, setSelectedListing, setSelectedCard });

  async function handleBuyCard(listingId: string): Promise<void> {
    const previousCatalog = catalog;
    const previousCollection = collection;
    const optimisticState = applyOptimisticBuyCard(catalog, collection, listingId);
    setCatalog(optimisticState.catalog);
    setCollection(optimisticState.collection);
    try {
      const result = await buyMarketCardAction(input.playerId, listingId);
      setCatalog(result.catalog);
      setTransactions(result.transactions);
      setCollection(result.collection);
      setErrorMessage(null);
    } catch (error) {
      setCatalog(previousCatalog);
      setCollection(previousCollection);
      setErrorMessage(error instanceof Error ? error.message : "No se pudo comprar la carta.");
    }
  }

  async function handleBuyPack(packId: string): Promise<void> {
    try {
      const result = await buyPackAction(input.playerId, packId);
      setCatalog(result.catalog);
      setTransactions(result.transactions);
      setCollection(result.collection);
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

  return {
    catalog,
    transactions,
    collection,
    selectedPackId,
    selectedListing,
    selectedCard,
    nameQuery,
    typeFilter,
    orderField,
    orderDirection,
    errorMessage,
    revealedPackCards,
    isPackRevealOpen,
    visibleListings,
    setSelectedPackId,
    setSelectedListing,
    setSelectedCard,
    setNameQuery,
    setTypeFilter,
    setOrderField,
    setOrderDirection,
    setIsPackRevealOpen,
    handleBuyCard,
    handleBuyPack,
  };
}
