// src/components/hub/market/internal/useMarketSceneState.ts - Encapsula estado y acciones del MarketScene para reducir complejidad del componente.
"use client";

import { useMemo, useState } from "react";
import { buildMarketListingView } from "@/components/hub/market/market-listing-view";
import { useSyncSelectedListing } from "@/components/hub/market/internal/useSyncSelectedListing";
import { MarketOrderDirection, MarketOrderField, MarketTypeFilter } from "@/components/hub/market/market-filters";
import { useHubModuleSfx } from "@/components/hub/internal/use-hub-module-sfx";
import { buildMarketVaultCollectionView } from "@/components/hub/market/vault/build-market-vault-collection-view";
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
  const { play } = useHubModuleSfx();
  const initialAvailableListing = input.initialCatalog.listings.find((listing) => listing.isAvailable) ?? input.initialCatalog.listings[0] ?? null;
  const [catalog, setCatalog] = useState<IMarketCatalog>(input.initialCatalog);
  const [transactions, setTransactions] = useState<IMarketTransaction[]>(input.initialTransactions);
  const [collection, setCollection] = useState<ICollectionCard[]>(input.initialCollection);
  const [selectedPackId, setSelectedPackId] = useState<string | null>(null);
  const [selectedListing, setSelectedListing] = useState<IMarketCardListing | null>(initialAvailableListing);
  const [selectedCard, setSelectedCard] = useState<ICard | null>(initialAvailableListing?.card ?? null);
  const [nameQuery, setNameQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<MarketTypeFilter>("ALL");
  const [orderField, setOrderField] = useState<MarketOrderField>("PRICE");
  const [orderDirection, setOrderDirection] = useState<MarketOrderDirection>("ASC");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [revealedPackCards, setRevealedPackCards] = useState<ICard[]>([]);
  const [isPackRevealOpen, setIsPackRevealOpen] = useState(false);
  const [isBuyingCard, setIsBuyingCard] = useState(false);
  const [isBuyingPack, setIsBuyingPack] = useState(false);

  const mapMarketErrorMessage = (error: unknown, fallback: string): string => {
    const rawMessage = error instanceof Error ? error.message : fallback;
    if (rawMessage.includes("Nexus suficiente")) {
      return "Saldo Nexus insuficiente. Compra cancelada en servidor para proteger tu cuenta.";
    }
    if (rawMessage.includes("stock")) {
      return "No hay stock disponible para esta carta. Prueba con otra opción del mercado.";
    }
    if (rawMessage.includes("no está disponible")) {
      return "Esta carta no está disponible para compra directa. Revisa la sección de packs.";
    }
    return rawMessage;
  };

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
  const mobileVisibleListings = useMemo(
    () =>
      buildMarketListingView({
        listings: catalog.listings.filter((listing) => listing.isAvailable),
        nameQuery,
        typeFilter,
        orderField,
        orderDirection,
      }),
    [catalog.listings, nameQuery, orderDirection, orderField, typeFilter],
  );
  const visibleCollection = useMemo(
    () =>
      buildMarketVaultCollectionView({
        collection,
        nameQuery,
        typeFilter,
        orderField,
        orderDirection,
      }),
    [collection, nameQuery, orderDirection, orderField, typeFilter],
  );

  useSyncSelectedListing({ selectedListing, visibleListings, setSelectedListing, setSelectedCard });

  async function handleBuyCard(listingId: string): Promise<boolean> {
    if (isBuyingCard) return false;
    setIsBuyingCard(true);
    try {
      const result = await buyMarketCardAction(input.playerId, listingId);
      play("BUY_CARD");
      setCatalog(result.catalog);
      setTransactions(result.transactions);
      setCollection(result.collection);
      setErrorMessage(null);
      return true;
    } catch (error) {
      setErrorMessage(mapMarketErrorMessage(error, "No se pudo comprar la carta en este momento."));
      return false;
    } finally {
      setIsBuyingCard(false);
    }
  }

  async function handleBuyPack(packId: string): Promise<boolean> {
    if (isBuyingPack) return false;
    setIsBuyingPack(true);
    try {
      const result = await buyPackAction(input.playerId, packId);
      play("BUY_PACK");
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
      return true;
    } catch (error) {
      setErrorMessage(mapMarketErrorMessage(error, "No se pudo comprar el sobre en este momento."));
      return false;
    } finally {
      setIsBuyingPack(false);
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
    isBuyingCard,
    isBuyingPack,
    visibleListings,
    mobileVisibleListings,
    visibleCollection,
    setSelectedPackId,
    setSelectedListing,
    setSelectedCard,
    setNameQuery,
    setTypeFilter,
    setOrderField,
    setOrderDirection,
    setErrorMessage,
    setIsPackRevealOpen,
    handleBuyCard,
    handleBuyPack,
  };
}
