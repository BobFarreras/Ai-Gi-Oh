// src/components/hub/market/internal/useMarketSceneState.ts - Orquesta estado/acciones de Market sobre store local Zustand y selectores derivados.
"use client";

import { SetStateAction, useCallback, useMemo } from "react";
import { buildMarketListingView } from "@/components/hub/market/market-listing-view";
import { useSyncSelectedListing } from "@/components/hub/market/internal/useSyncSelectedListing";
import { useHubModuleSfx } from "@/components/hub/internal/use-hub-module-sfx";
import { buildMarketVaultCollectionView } from "@/components/hub/market/vault/build-market-vault-collection-view";
import { ICollectionCard } from "@/core/entities/home/ICollectionCard";
import { IMarketTransaction } from "@/core/entities/market/IMarketTransaction";
import { IPlayerCardProgress } from "@/core/entities/progression/IPlayerCardProgress";
import { IMarketCardListing } from "@/core/entities/market/IMarketCardListing";
import { applyCardProgressionToCard } from "@/services/game/apply-card-progression-to-card";
import { IMarketCatalog } from "@/core/use-cases/market/GetMarketCatalogUseCase";
import { useMarketPurchaseActions } from "@/components/hub/market/internal/useMarketPurchaseActions";
import { useLocalMarketSceneStore, useMarketStoreSelector } from "@/components/hub/market/internal/market-scene-store";
import { IMarketPurchaseActionOverrides } from "@/components/hub/market/internal/market-tutorial-contract";
import { countRender } from "@/services/performance/dev-performance-telemetry";

interface UseMarketSceneStateInput {
  playerId: string;
  isDesktopLayout: boolean;
  initialCatalog: IMarketCatalog;
  initialTransactions: IMarketTransaction[];
  initialCollection: ICollectionCard[];
  cardProgress?: IPlayerCardProgress[];
  purchaseActionOverrides?: IMarketPurchaseActionOverrides;
}

export function useMarketSceneState(input: UseMarketSceneStateInput) {
  countRender("useMarketSceneState");
  const { play } = useHubModuleSfx();
  const store = useLocalMarketSceneStore(input.initialCatalog, input.initialTransactions, input.initialCollection);
  const catalog = useMarketStoreSelector(store, (state) => state.catalog);
  const transactions = useMarketStoreSelector(store, (state) => state.transactions);
  const collection = useMarketStoreSelector(store, (state) => state.collection);
  const selectedPackId = useMarketStoreSelector(store, (state) => state.selectedPackId);
  const selectedListing = useMarketStoreSelector(store, (state) => state.selectedListing);
  const selectedCard = useMarketStoreSelector(store, (state) => state.selectedCard);
  const nameQuery = useMarketStoreSelector(store, (state) => state.nameQuery);
  const typeFilter = useMarketStoreSelector(store, (state) => state.typeFilter);
  const orderField = useMarketStoreSelector(store, (state) => state.orderField);
  const orderDirection = useMarketStoreSelector(store, (state) => state.orderDirection);
  const errorMessage = useMarketStoreSelector(store, (state) => state.errorMessage);
  const revealedPackCards = useMarketStoreSelector(store, (state) => state.revealedPackCards);
  const isPackRevealOpen = useMarketStoreSelector(store, (state) => state.isPackRevealOpen);
  const isBuyingPack = useMarketStoreSelector(store, (state) => state.isBuyingPack);
  const setSelectedListing = useCallback(
    (value: SetStateAction<typeof selectedListing>) =>
      store.setState((state) => ({ selectedListing: typeof value === "function" ? value(state.selectedListing) : value })),
    [store],
  );
  const setSelectedCard = useCallback(
    (value: SetStateAction<typeof selectedCard>) =>
      store.setState((state) => ({ selectedCard: typeof value === "function" ? value(state.selectedCard) : value })),
    [store],
  );
  const setSelectedPackId = useCallback((value: string | null) => store.setState({ selectedPackId: value }), [store]);
  const setNameQuery = useCallback((value: string) => store.setState({ nameQuery: value }), [store]);
  const setTypeFilter = useCallback((value: typeof typeFilter) => store.setState({ typeFilter: value }), [store]);
  const setOrderField = useCallback((value: typeof orderField) => store.setState({ orderField: value }), [store]);
  const setOrderDirection = useCallback(
    (value: typeof orderDirection | ((previous: typeof orderDirection) => typeof orderDirection)) =>
      store.setState((state) => ({ orderDirection: typeof value === "function" ? value(state.orderDirection) : value })),
    [store],
  );
  const setErrorMessage = useCallback((value: string | null) => store.setState({ errorMessage: value }), [store]);
  // Saldo tras comprar un objeto: lo devuelve la propia transacción de compra, así que se refleja al momento y
  // la cabecera no se queda mintiendo hasta la siguiente recarga.
  const setWalletNexus = useCallback(
    (nexus: number) =>
      store.setState((state) => ({ catalog: { ...state.catalog, wallet: { ...state.catalog.wallet, nexus } } })),
    [store],
  );
  const setIsPackRevealOpen = useCallback((value: boolean) => store.setState({ isPackRevealOpen: value }), [store]);
  // Reutiliza listados disponibles para evitar filtros repetidos en desktop/mobile.
  const availableListings = useMemo(
    () => catalog.listings.filter((listing) => listing.isAvailable),
    [catalog.listings],
  );
  const scopedListings = useMemo(() => {
    if (!selectedPackId) return availableListings;
    const selectedPack = catalog.packs.find((pack) => pack.id === selectedPackId);
    if (!selectedPack) return availableListings;
    const previewSet = new Set(selectedPack.previewCardIds);
    return catalog.listings.filter((listing) => previewSet.has(listing.card.id));
  }, [availableListings, catalog.listings, catalog.packs, selectedPackId]);
  const visibleListings = useMemo(
    () => buildMarketListingView({ listings: scopedListings, nameQuery, typeFilter, orderField, orderDirection }),
    [nameQuery, orderDirection, orderField, scopedListings, typeFilter],
  );
  const mobileVisibleListings = useMemo(
    () => (input.isDesktopLayout
      ? visibleListings
      : buildMarketListingView({ listings: availableListings, nameQuery, typeFilter, orderField, orderDirection })),
    [availableListings, input.isDesktopLayout, nameQuery, orderDirection, orderField, typeFilter, visibleListings],
  );
  const visibleCollection = useMemo(
    () => buildMarketVaultCollectionView({ collection, nameQuery, typeFilter, orderField, orderDirection }),
    [collection, nameQuery, orderDirection, orderField, typeFilter],
  );
  useSyncSelectedListing({ selectedListing, visibleListings, setSelectedListing, setSelectedCard });
  const { handleBuyCard, handleBuyPack } = useMarketPurchaseActions({
    store,
    playerId: input.playerId,
    play,
    purchaseActionOverrides: input.purchaseActionOverrides,
  });

  // Hidratación SOLO para display: el mercado muestra ATK/DEF/coste de cada carta según el nivel/versión
  // que el jugador tiene de ESA carta (si la posee). El store mantiene las cartas base para la compra.
  const cardProgressById = useMemo(
    () => new Map((input.cardProgress ?? []).map((progress) => [progress.cardId, progress])),
    [input.cardProgress],
  );
  const hydrateListings = useCallback(
    (listings: IMarketCardListing[]): IMarketCardListing[] =>
      cardProgressById.size === 0
        ? listings
        : listings.map((listing) => ({ ...listing, card: applyCardProgressionToCard(listing.card, cardProgressById.get(listing.card.id) ?? null) })),
    [cardProgressById],
  );
  const displaySelectedCard = useMemo(
    () => (selectedCard ? applyCardProgressionToCard(selectedCard, cardProgressById.get(selectedCard.id) ?? null) : null),
    [selectedCard, cardProgressById],
  );
  const displayVisibleListings = useMemo(() => hydrateListings(visibleListings), [hydrateListings, visibleListings]);
  const displayMobileVisibleListings = useMemo(() => hydrateListings(mobileVisibleListings), [hydrateListings, mobileVisibleListings]);
  const displayVisibleCollection = useMemo(
    () => (cardProgressById.size === 0
      ? visibleCollection
      : visibleCollection.map((entry) => ({ ...entry, card: applyCardProgressionToCard(entry.card, cardProgressById.get(entry.card.id) ?? null) }))),
    [cardProgressById, visibleCollection],
  );

  return {
    catalog,
    transactions,
    collection,
    selectedPackId,
    selectedListing,
    selectedCard: displaySelectedCard,
    nameQuery,
    typeFilter,
    orderField,
    orderDirection,
    errorMessage,
    revealedPackCards,
    isPackRevealOpen,
    isBuyingPack,
    visibleListings: displayVisibleListings,
    mobileVisibleListings: displayMobileVisibleListings,
    visibleCollection: displayVisibleCollection,
    setSelectedPackId,
    setSelectedListing,
    setSelectedCard,
    setNameQuery,
    setTypeFilter,
    setOrderField,
    setOrderDirection,
    setErrorMessage,
    setWalletNexus,
    setIsPackRevealOpen,
    handleBuyCard,
    handleBuyPack,
  };
}
