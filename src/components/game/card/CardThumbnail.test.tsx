// src/components/game/card/CardThumbnail.test.tsx - Pruebas de la miniatura de carta con anatomía completa estática.
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
  bgUrl: "/assets/bgs/bg-tech.webp",
};

describe("CardThumbnail", () => {
  it("muestra nombre, coste, tipo y stats como la Card real", () => {
    render(<CardThumbnail card={entityCard} />);
    expect(screen.getByText("Claude Fable")).toBeInTheDocument();
    expect(screen.getByText("6")).toBeInTheDocument();
    expect(screen.getByText("LLM")).toBeInTheDocument();
    expect(screen.getByText("2800")).toBeInTheDocument();
    expect(screen.getByText("2100")).toBeInTheDocument();
    expect(screen.getByAltText("Miniatura de Claude Fable")).toBeInTheDocument();
  });

  it("renderiza el arte de fondo además del render cuando hay bgUrl", () => {
    const { container } = render(<CardThumbnail card={entityCard} />);
    expect(container.querySelectorAll("img")).toHaveLength(2);
  });

  it("muestra sello MAGIA en ejecuciones, como el footer del Card", () => {
    render(<CardThumbnail card={{ ...entityCard, type: "EXECUTION", attack: undefined, defense: undefined }} />);
    expect(screen.getByText("MAGIA")).toBeInTheDocument();
    expect(screen.queryByText("2800")).not.toBeInTheDocument();
  });

  it("muestra versión mastery y barra de nivel cuando se aportan", () => {
    render(<CardThumbnail card={entityCard} versionTier={5} level={3} xp={120} />);
    expect(screen.getByText("V5")).toBeInTheDocument();
    expect(screen.getByText("L3")).toBeInTheDocument();
  });

  it("no monta animaciones: la miniatura es estática", () => {
    const { container } = render(<CardThumbnail card={entityCard} versionTier={5} level={3} />);
    expect(container.querySelectorAll("[class*='animate-']")).toHaveLength(0);
  });

  it("marca las mejoras con SOLO el icono (sin ×N) para no tapar el arte de la miniatura", () => {
    render(<CardThumbnail card={{ ...entityCard, upgradeCounts: { attack: 2, defense: 1 } }} />);
    // El sello existe (accesible con su cuenta), pero no pinta el número sobre la miniatura.
    expect(screen.getByLabelText("2 mejoras de ataque")).toBeInTheDocument();
    expect(screen.getByLabelText("1 mejora de defensa")).toBeInTheDocument();
    expect(screen.queryByText(/×2|×1/)).not.toBeInTheDocument();
  });

  it("sin upgradeCounts no pinta badges (cartas sin mejoras ni el tablero base)", () => {
    render(<CardThumbnail card={entityCard} />);
    expect(screen.queryByLabelText(/mejoras de ataque/)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/mejoras de defensa/)).not.toBeInTheDocument();
  });
});
