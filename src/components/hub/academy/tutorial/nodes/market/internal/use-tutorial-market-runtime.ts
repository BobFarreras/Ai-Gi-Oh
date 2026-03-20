// src/components/hub/academy/tutorial/nodes/market/internal/use-tutorial-market-runtime.ts - Gestiona compras mock del tutorial Market sobre el mismo contrato runtime del módulo real.
"use client";
import { useMemo, useRef } from "react";
import { ICollectionCard } from "@/core/entities/home/ICollectionCard";
import { IMarketCardListing } from "@/core/entities/market/IMarketCardListing";
import { IMarketTransaction } from "@/core/entities/market/IMarketTransaction";
import { IMarketCatalog } from "@/core/use-cases/market/GetMarketCatalogUseCase";
import { IMarketPurchaseActionOverrides } from "@/components/hub/market/internal/market-tutorial-contract";
import { IMarketRuntimeSnapshot } from "@/services/market/market-runtime-snapshot";
import { createTutorialMarketMockData } from "@/components/hub/academy/tutorial/nodes/market/internal/create-tutorial-market-mock-data";

interface ITutorialMarketRuntime {
  initialCatalog: IMarketCatalog;
  initialTransactions: IMarketTransaction[];
  initialCollection: ICollectionCard[];
  purchaseActionOverrides: IMarketPurchaseActionOverrides;
}

interface ITutorialMarketRuntimeRef {
  catalog: IMarketCatalog;
  transactions: IMarketTransaction[];
  collection: ICollectionCard[];
  txCounter: number;
  packCursorById: Record<string, number>;
  packPools: Record<string, string[]>;
}

function createTransactionId(runtime: ITutorialMarketRuntimeRef, purchasedItemId: string): string {
  // ID incremental para mantener historial legible y determinista en tests.
  runtime.txCounter += 1;
  return `tutorial-market-tx-${purchasedItemId}-${runtime.txCounter}`;
}

function appendCollectionCard(collection: ICollectionCard[], cardId: string, listings: IMarketCardListing[]): ICollectionCard[] {
  const targetListing = listings.find((listing) => listing.card.id === cardId);
  if (!targetListing) return collection;
  const card = targetListing.card;
  const current = collection.find((entry) => entry.card.id === cardId);
  if (!current) return [...collection, { card, ownedCopies: 1 }];
  return collection.map((entry) => (entry.card.id === cardId ? { ...entry, ownedCopies: entry.ownedCopies + 1 } : entry));
}

function cloneSnapshot(runtime: ITutorialMarketRuntimeRef): IMarketRuntimeSnapshot {
  return {
    catalog: runtime.catalog,
    transactions: runtime.transactions,
    collection: runtime.collection,
  };
}

/**
 * Reproduce operaciones de compra de Market sobre datos mock para mantener tutorial estable y repetible.
 */
export function useTutorialMarketRuntime(): ITutorialMarketRuntime {
  const initialData = useMemo(() => createTutorialMarketMockData(), []);
  const runtimeRef = useRef<ITutorialMarketRuntimeRef>({
    catalog: initialData.catalog,
    transactions: initialData.transactions,
    collection: initialData.collection,
    txCounter: 1,
    packCursorById: {},
    packPools: initialData.packPools,
  });

  const purchaseActionOverrides = useMemo<IMarketPurchaseActionOverrides>(() => ({
    buyCard: async (playerId, listingId) => {
      const runtime = runtimeRef.current;
      const listing = runtime.catalog.listings.find((entry) => entry.id === listingId);
      if (!listing || !listing.isAvailable) throw new Error("Carta no disponible para compra");
      runtime.catalog = {
        ...runtime.catalog,
        wallet: { ...runtime.catalog.wallet, nexus: runtime.catalog.wallet.nexus - listing.priceNexus },
      };
      runtime.collection = appendCollectionCard(runtime.collection, listing.card.id, runtime.catalog.listings);
      runtime.transactions = [
        {
          id: createTransactionId(runtime, listing.id),
          playerId,
          transactionType: "BUY_CARD",
          amountNexus: listing.priceNexus,
          purchasedItemId: listing.id,
          purchasedCardIds: [listing.card.id],
          createdAtIso: new Date().toISOString(),
        },
        ...runtime.transactions,
      ];
      return cloneSnapshot(runtime);
    },
    buyPack: async (playerId, packId) => {
      const runtime = runtimeRef.current;
      const pack = runtime.catalog.packs.find((entry) => entry.id === packId);
      if (!pack) throw new Error("Pack no disponible");
      const pool = runtime.packPools[packId] ?? [];
      const cursor = runtime.packCursorById[packId] ?? 0;
      const openedCardIds = Array.from({ length: pack.cardsPerPack }).map((_, index) => {
        const poolIndex = (cursor + index) % pool.length;
        return pool[poolIndex] ?? "entity-react";
      });
      runtime.packCursorById[packId] = cursor + pack.cardsPerPack;
      runtime.catalog = {
        ...runtime.catalog,
        wallet: { ...runtime.catalog.wallet, nexus: runtime.catalog.wallet.nexus - pack.priceNexus },
      };
      runtime.collection = openedCardIds.reduce(
        (collection, cardId) => appendCollectionCard(collection, cardId, runtime.catalog.listings),
        runtime.collection,
      );
      runtime.transactions = [
        {
          id: createTransactionId(runtime, pack.id),
          playerId,
          transactionType: "BUY_PACK",
          amountNexus: pack.priceNexus,
          purchasedItemId: pack.id,
          purchasedCardIds: openedCardIds,
          createdAtIso: new Date().toISOString(),
        },
        ...runtime.transactions,
      ];
      return { ...cloneSnapshot(runtime), openedCardIds };
    },
  }), []);

  return {
    initialCatalog: initialData.catalog,
    initialTransactions: initialData.transactions,
    initialCollection: initialData.collection,
    purchaseActionOverrides,
  };
}
