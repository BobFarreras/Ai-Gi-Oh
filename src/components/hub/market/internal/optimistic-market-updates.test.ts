// src/components/hub/market/internal/optimistic-market-updates.test.ts - Verifica actualizaciones optimistas de compra en Market.
import { describe, expect, it } from "vitest";
import { ICard } from "@/core/entities/ICard";
import { ICollectionCard } from "@/core/entities/home/ICollectionCard";
import { IMarketCatalog } from "@/core/use-cases/market/GetMarketCatalogUseCase";
import { applyOptimisticBuyCard } from "@/components/hub/market/internal/optimistic-market-updates";

function createCard(id: string): ICard {
  return { id, name: id, description: id, type: "ENTITY", faction: "OPEN_SOURCE", cost: 3, attack: 1200, defense: 1100 };
}

function createCatalog(card: ICard): IMarketCatalog {
  return {
    wallet: { playerId: "p1", nexus: 300 },
    listings: [{ id: "l1", card, rarity: "COMMON", priceNexus: 100, stock: 2, isAvailable: true }],
    packs: [],
  };
}

describe("applyOptimisticBuyCard", () => {
  it("descuenta nexus, reduce stock y suma copia a colección", () => {
    const card = createCard("entity-test");
    const result = applyOptimisticBuyCard(createCatalog(card), [], "l1");
    expect(result.catalog.wallet.nexus).toBe(200);
    expect(result.catalog.listings[0].stock).toBe(1);
    expect(result.collection[0]).toEqual({ card, ownedCopies: 1 });
  });

  it("no modifica estado si listing no existe", () => {
    const card = createCard("entity-test");
    const catalog = createCatalog(card);
    const collection: ICollectionCard[] = [];
    const result = applyOptimisticBuyCard(catalog, collection, "missing");
    expect(result.catalog).toBe(catalog);
    expect(result.collection).toBe(collection);
  });
});
