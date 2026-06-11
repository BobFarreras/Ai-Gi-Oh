// src/components/hub/market/vault/MarketVaultCollectionTab.test.tsx - Valida que el almacén del market renderiza miniaturas estáticas con contador de copias.
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ICard } from "@/core/entities/ICard";
import { ICollectionCard } from "@/core/entities/home/ICollectionCard";
import { MarketVaultCollectionTab } from "./MarketVaultCollectionTab";

function createCard(id: string, name: string): ICard {
  return {
    id,
    name,
    description: "Carta de prueba",
    type: "ENTITY",
    faction: "BIG_TECH",
    cost: 4,
    attack: 1400,
    defense: 1200,
    bgUrl: "/assets/bgs/bg-tech.webp",
    renderUrl: "/assets/renders/react.webp",
  };
}

function createCollection(card: ICard): ICollectionCard[] {
  return [{ card, ownedCopies: 2 }];
}

describe("MarketVaultCollectionTab", () => {
  it("renderiza la miniatura estática de la carta con sus stats y copias", () => {
    const card = createCard("entity-react", "React");
    render(
      <MarketVaultCollectionTab
        collection={createCollection(card)}
        onSelectCard={() => undefined}
        isPerformanceMode={false}
      />,
    );

    expect(screen.getByAltText("Miniatura de React")).toBeInTheDocument();
    expect(screen.getByText("React")).toBeInTheDocument();
    expect(screen.getByText("x2")).toBeInTheDocument();
  });

  it("no monta animaciones infinitas por carta en el grid", () => {
    const card = createCard("entity-sql", "SQL");
    const { container } = render(
      <MarketVaultCollectionTab
        collection={createCollection(card)}
        onSelectCard={() => undefined}
        isPerformanceMode={true}
      />,
    );

    expect(container.querySelectorAll("[class*='animate-']")).toHaveLength(0);
  });
});
