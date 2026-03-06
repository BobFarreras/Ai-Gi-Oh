// src/components/hub/market/internal/useMarketSceneState.test.ts - Valida el estado inicial del mercado para flujo mobile y cartas sueltas.
import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useMarketSceneState } from "@/components/hub/market/internal/useMarketSceneState";
import { ICard } from "@/core/entities/ICard";
import { ICollectionCard } from "@/core/entities/home/ICollectionCard";
import { IMarketCardListing } from "@/core/entities/market/IMarketCardListing";
import { IMarketTransaction } from "@/core/entities/market/IMarketTransaction";
import { IMarketCatalog } from "@/core/use-cases/market/GetMarketCatalogUseCase";

vi.mock("@/services/market/market-actions", () => ({
  buyMarketCardAction: vi.fn(),
  buyPackAction: vi.fn(),
}));

const ENTITY_CARD: ICard = {
  id: "entity-a",
  name: "Entity A",
  description: "Carta de prueba",
  type: "ENTITY",
  faction: "NEUTRAL",
  cost: 2,
  attack: 1000,
  defense: 900,
};

const PACK_ONLY_CARD: ICard = {
  id: "entity-pack",
  name: "Entity Pack",
  description: "Solo en pack",
  type: "ENTITY",
  faction: "NEUTRAL",
  cost: 3,
  attack: 1200,
  defense: 600,
};

const LISTINGS: IMarketCardListing[] = [
  { id: "listing-1", card: ENTITY_CARD, rarity: "COMMON", priceNexus: 100, stock: 8, isAvailable: true },
  { id: "listing-2", card: PACK_ONLY_CARD, rarity: "EPIC", priceNexus: 300, stock: null, isAvailable: false },
];

const CATALOG: IMarketCatalog = {
  wallet: { playerId: "player-1", nexus: 1200 },
  listings: LISTINGS,
  packs: [
    {
      id: "pack-1",
      name: "Pack 1",
      description: "Pack de prueba",
      priceNexus: 500,
      cardsPerPack: 5,
      packPoolId: "pool-1",
      previewCardIds: ["entity-pack"],
      isAvailable: true,
    },
  ],
};

const TRANSACTIONS: IMarketTransaction[] = [];
const COLLECTION: ICollectionCard[] = [{ card: ENTITY_CARD, ownedCopies: 1 }];

describe("useMarketSceneState", () => {
  it("inicia en cartas sueltas y filtra solo cartas disponibles", () => {
    const { result } = renderHook(() =>
      useMarketSceneState({
        playerId: "player-1",
        initialCatalog: CATALOG,
        initialTransactions: TRANSACTIONS,
        initialCollection: COLLECTION,
      }),
    );

    expect(result.current.selectedPackId).toBeNull();
    expect(result.current.visibleListings).toHaveLength(1);
    expect(result.current.visibleListings[0]?.id).toBe("listing-1");
    expect(result.current.selectedListing?.id).toBe("listing-1");
  });
});
