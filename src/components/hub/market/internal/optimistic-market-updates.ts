// src/components/hub/market/internal/optimistic-market-updates.ts - Actualizaciones optimistas de Market para mejorar respuesta percibida en compras.
import { ICollectionCard } from "@/core/entities/home/ICollectionCard";
import { IMarketCatalog } from "@/core/use-cases/market/GetMarketCatalogUseCase";

interface IOptimisticMarketUpdate {
  catalog: IMarketCatalog;
  collection: ICollectionCard[];
}

export function applyOptimisticBuyCard(
  catalog: IMarketCatalog,
  collection: ICollectionCard[],
  listingId: string,
): IOptimisticMarketUpdate {
  const listing = catalog.listings.find((entry) => entry.id === listingId);
  if (!listing || !listing.isAvailable || catalog.wallet.nexus < listing.priceNexus) return { catalog, collection };
  const nextStock = listing.stock === null ? null : Math.max(0, listing.stock - 1);
  const nextListings = catalog.listings.map((entry) =>
    entry.id === listingId ? { ...entry, stock: nextStock, isAvailable: nextStock === null || nextStock > 0 } : entry,
  );
  const existingIndex = collection.findIndex((entry) => entry.card.id === listing.card.id);
  const nextCollection =
    existingIndex >= 0
      ? collection.map((entry, index) => (index === existingIndex ? { ...entry, ownedCopies: entry.ownedCopies + 1 } : entry))
      : [...collection, { card: listing.card, ownedCopies: 1 }];
  return {
    catalog: { ...catalog, wallet: { ...catalog.wallet, nexus: catalog.wallet.nexus - listing.priceNexus }, listings: nextListings },
    collection: nextCollection,
  };
}
