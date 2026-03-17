// src/components/hub/market/listings/MarketListingsPanel.test.tsx - Verifica el modo visual de cartas (full/lite) del grid principal del mercado.
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ICard } from "@/core/entities/ICard";
import { IMarketCardListing } from "@/core/entities/market/IMarketCardListing";
import { MarketListingsPanel } from "./MarketListingsPanel";

function createCard(id: string, name: string): ICard {
  return {
    id,
    name,
    description: "Carta de prueba",
    type: "ENTITY",
    faction: "BIG_TECH",
    cost: 3,
    attack: 1200,
    defense: 900,
    bgUrl: "/assets/backgrounds/card-bg-tech.webp",
    renderUrl: "/assets/renders/python.png",
  };
}

function createListing(card: ICard): IMarketCardListing {
  return {
    id: `listing-${card.id}`,
    card,
    rarity: "COMMON",
    priceNexus: 100,
    stock: 5,
    isAvailable: true,
  };
}

describe("MarketListingsPanel", () => {
  class MockResizeObserver {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
  }
  (globalThis as { ResizeObserver?: typeof ResizeObserver }).ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;

  it("aplica render completo en desktop y mantiene sombras del arte", () => {
    const listing = createListing(createCard("entity-python", "Python"));
    render(<MarketListingsPanel listings={[listing]} isPerformanceMode={false} onSelectCard={() => undefined} />);

    const renderImage = screen.getByAltText("Python");
    expect(renderImage.className).toContain("drop-shadow");
  });

  it("aplica render lite en móvil para reducir coste visual", () => {
    const listing = createListing(createCard("entity-postgres", "Postgres"));
    render(<MarketListingsPanel listings={[listing]} isPerformanceMode={true} onSelectCard={() => undefined} />);

    const renderImage = screen.getByAltText("Postgres");
    expect(renderImage.className).not.toContain("drop-shadow");
  });
});
