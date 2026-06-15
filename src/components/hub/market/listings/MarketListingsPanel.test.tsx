// src/components/hub/market/listings/MarketListingsPanel.test.tsx - Verifica que el grid del mercado renderiza miniaturas estáticas con precio.
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
    bgUrl: "/assets/bgs/bg-tech.webp",
    renderUrl: "/assets/renders/python.webp",
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

  it("renderiza la miniatura estática con precio y selección accesible", () => {
    const listing = createListing(createCard("entity-python", "Python"));
    render(<MarketListingsPanel listings={[listing]} isPerformanceMode={false} onSelectCard={() => undefined} />);

    expect(screen.getByAltText("Miniatura de Python")).toBeInTheDocument();
    expect(screen.getByText("100 NX")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Seleccionar Python" })).toBeInTheDocument();
  });

  it("en modo rendimiento también usa la miniatura estática (sin Card completa)", () => {
    const listing = createListing(createCard("entity-postgres", "Postgres"));
    const { container } = render(
      <MarketListingsPanel listings={[listing]} isPerformanceMode={true} onSelectCard={() => undefined} />,
    );

    expect(screen.getByAltText("Miniatura de Postgres")).toBeInTheDocument();
    expect(container.querySelectorAll("[class*='animate-']")).toHaveLength(0);
  });
});
