// src/components/hub/market/vault/MarketVaultCollectionTab.test.tsx - Valida la calidad visual del almacén del market según perfil de rendimiento.
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
    bgUrl: "/assets/backgrounds/card-bg-tech.webp",
    renderUrl: "/assets/renders/react.webp",
  };
}

function createCollection(card: ICard): ICollectionCard[] {
  return [{ card, ownedCopies: 2 }];
}

describe("MarketVaultCollectionTab", () => {
  it("usa carta full quality en desktop", () => {
    const card = createCard("entity-react", "React");
    render(
      <MarketVaultCollectionTab
        collection={createCollection(card)}
        onSelectCard={() => undefined}
        isPerformanceMode={false}
      />,
    );

    const renderImage = screen.getByAltText("React");
    expect(renderImage.className).toContain("drop-shadow");
  });

  it("usa carta lite en móvil", () => {
    const card = createCard("entity-sql", "SQL");
    render(
      <MarketVaultCollectionTab
        collection={createCollection(card)}
        onSelectCard={() => undefined}
        isPerformanceMode={true}
      />,
    );

    const renderImage = screen.getByAltText("SQL");
    expect(renderImage.className).not.toContain("drop-shadow");
  });
});
