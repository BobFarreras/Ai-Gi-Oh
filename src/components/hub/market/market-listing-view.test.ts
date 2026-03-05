// src/components/hub/market/market-listing-view.test.ts - Pruebas unitarias de filtro y orden para el catálogo del mercado.
import { describe, expect, it } from "vitest";
import { ENTITY_CARDS } from "@/core/data/mock-cards/entities";
import { EXECUTION_CARDS } from "@/core/data/mock-cards/executions";
import { IMarketCardListing } from "@/core/entities/market/IMarketCardListing";
import { buildMarketListingView } from "@/components/hub/market/market-listing-view";

function createListing(cardId: string, priceNexus: number): IMarketCardListing {
  const allCards = [...ENTITY_CARDS, ...EXECUTION_CARDS];
  const card = allCards.find((currentCard) => currentCard.id === cardId);
  if (!card) {
    throw new Error(`No existe carta mock para ${cardId}`);
  }
  return {
    id: `listing-${cardId}`,
    card,
    rarity: "COMMON",
    priceNexus,
    stock: null,
    isAvailable: true,
  };
}

describe("buildMarketListingView", () => {
  const listings: IMarketCardListing[] = [
    createListing("entity-python", 90),
    createListing("entity-vscode", 120),
    createListing("exec-draw-1", 80),
  ];

  it("filtra por nombre ignorando mayúsculas", () => {
    const result = buildMarketListingView({
      listings,
      nameQuery: "PYTH",
      typeFilter: "ALL",
      orderField: "NAME",
      orderDirection: "ASC",
    });
    expect(result).toHaveLength(1);
    expect(result[0].card.id).toBe("entity-python");
  });

  it("filtra por tipo de carta", () => {
    const result = buildMarketListingView({
      listings,
      nameQuery: "",
      typeFilter: "EXECUTION",
      orderField: "NAME",
      orderDirection: "ASC",
    });
    expect(result).toHaveLength(1);
    expect(result[0].card.type).toBe("EXECUTION");
  });

  it("ordena por precio descendente", () => {
    const result = buildMarketListingView({
      listings,
      nameQuery: "",
      typeFilter: "ALL",
      orderField: "PRICE",
      orderDirection: "DESC",
    });
    expect(result.map((listing) => listing.priceNexus)).toEqual([120, 90, 80]);
  });
});
