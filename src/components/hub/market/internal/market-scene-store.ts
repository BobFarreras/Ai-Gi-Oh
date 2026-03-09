// src/components/hub/market/internal/market-scene-store.ts - Store Zustand local para estado UI y datos del módulo Market.
import { useState } from "react";
import { useStore } from "zustand";
import { createStore, StoreApi } from "zustand/vanilla";
import { ICard } from "@/core/entities/ICard";
import { ICollectionCard } from "@/core/entities/home/ICollectionCard";
import { IMarketCardListing } from "@/core/entities/market/IMarketCardListing";
import { IMarketTransaction } from "@/core/entities/market/IMarketTransaction";
import { IMarketCatalog } from "@/core/use-cases/market/GetMarketCatalogUseCase";
import { MarketOrderDirection, MarketOrderField, MarketTypeFilter } from "@/components/hub/market/market-filters";

export interface IMarketSceneStoreState {
  catalog: IMarketCatalog;
  transactions: IMarketTransaction[];
  collection: ICollectionCard[];
  selectedPackId: string | null;
  selectedListing: IMarketCardListing | null;
  selectedCard: ICard | null;
  nameQuery: string;
  typeFilter: MarketTypeFilter;
  orderField: MarketOrderField;
  orderDirection: MarketOrderDirection;
  errorMessage: string | null;
  revealedPackCards: ICard[];
  isPackRevealOpen: boolean;
  isBuyingPack: boolean;
}

export type MarketSceneStoreApi = StoreApi<IMarketSceneStoreState>;

function createInitialState(catalog: IMarketCatalog, transactions: IMarketTransaction[], collection: ICollectionCard[]): IMarketSceneStoreState {
  const initialAvailableListing = catalog.listings.find((listing) => listing.isAvailable) ?? catalog.listings[0] ?? null;
  return {
    catalog,
    transactions,
    collection,
    selectedPackId: null,
    selectedListing: initialAvailableListing,
    selectedCard: initialAvailableListing?.card ?? null,
    nameQuery: "",
    typeFilter: "ALL",
    orderField: "PRICE",
    orderDirection: "ASC",
    errorMessage: null,
    revealedPackCards: [],
    isPackRevealOpen: false,
    isBuyingPack: false,
  };
}

export function createMarketSceneStore(catalog: IMarketCatalog, transactions: IMarketTransaction[], collection: ICollectionCard[]): MarketSceneStoreApi {
  return createStore<IMarketSceneStoreState>(() => createInitialState(catalog, transactions, collection));
}

export function useLocalMarketSceneStore(catalog: IMarketCatalog, transactions: IMarketTransaction[], collection: ICollectionCard[]): MarketSceneStoreApi {
  const [store] = useState<MarketSceneStoreApi>(() => createMarketSceneStore(catalog, transactions, collection));
  return store;
}

export function useMarketStoreSelector<T>(store: MarketSceneStoreApi, selector: (state: IMarketSceneStoreState) => T): T {
  return useStore(store, selector);
}
