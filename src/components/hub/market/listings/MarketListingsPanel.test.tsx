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
  it("renderiza la miniatura estática con precio y selección accesible", () => {
    const listing = createListing(createCard("entity-python", "Python"));
    render(<MarketListingsPanel listings={[listing]} onSelectCard={() => undefined} />);

    expect(screen.getByAltText("Miniatura de Python")).toBeInTheDocument();
    expect(screen.getByText("100 NX")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Seleccionar Python" })).toBeInTheDocument();
  });

  it("usa la miniatura estática (sin Card completa con animaciones)", () => {
    const listing = createListing(createCard("entity-postgres", "Postgres"));
    const { container } = render(
      <MarketListingsPanel listings={[listing]} onSelectCard={() => undefined} />,
    );

    expect(screen.getByAltText("Miniatura de Postgres")).toBeInTheDocument();
    expect(container.querySelectorAll("[class*='animate-']")).toHaveLength(0);
  });

  it("renderiza todas las cartas del catálogo sin recortar la última fila", () => {
    const listings = Array.from({ length: 23 }, (_, index) =>
      createListing(createCard(`entity-${index}`, `Carta ${index}`)),
    );
    render(<MarketListingsPanel listings={listings} onSelectCard={() => undefined} />);

    // Sin virtualización JS: todas las cartas existen en el DOM desde el inicio.
    expect(screen.getAllByRole("button", { name: /^Seleccionar Carta/ })).toHaveLength(23);
  });
});
