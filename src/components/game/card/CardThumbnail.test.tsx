// src/components/game/card/CardThumbnail.test.tsx - Pruebas de la miniatura ligera de carta para listas y mosaicos.
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ICard } from "@/core/entities/ICard";
import { CardThumbnail } from "./CardThumbnail";

const entityCard: ICard = {
  id: "thumb-entity",
  name: "Claude Fable",
  description: "Modelo de Anthropic",
  type: "ENTITY",
  faction: "BIG_TECH",
  cost: 6,
  attack: 2800,
  defense: 2100,
  archetype: "LLM",
  renderUrl: "/assets/renders/claude.webp",
};

describe("CardThumbnail", () => {
  it("muestra nombre, coste y stats de una entidad", () => {
    render(<CardThumbnail card={entityCard} />);
    expect(screen.getByText("Claude Fable")).toBeInTheDocument();
    expect(screen.getByText("6")).toBeInTheDocument();
    expect(screen.getByText("2800")).toBeInTheDocument();
    expect(screen.getByText("2100")).toBeInTheDocument();
    expect(screen.getByAltText("Miniatura de Claude Fable")).toBeInTheDocument();
  });

  it("muestra etiqueta de tipo en cartas no-entidad en vez de stats", () => {
    render(<CardThumbnail card={{ ...entityCard, type: "TRAP", attack: undefined, defense: undefined }} />);
    expect(screen.getByText("TRAMPA")).toBeInTheDocument();
    expect(screen.queryByText("2800")).not.toBeInTheDocument();
  });

  it("muestra badge mastery V5 y nivel cuando se aportan", () => {
    render(<CardThumbnail card={entityCard} versionTier={5} level={3} />);
    expect(screen.getByText("V5")).toBeInTheDocument();
    expect(screen.getByText("L3")).toBeInTheDocument();
  });

  it("no monta animaciones: la miniatura es estática", () => {
    const { container } = render(<CardThumbnail card={entityCard} versionTier={5} />);
    expect(container.querySelectorAll("[class*='animate-']")).toHaveLength(0);
  });
});
