// src/components/game/card/internal/CardHologramStatColumn.test.tsx - Tests de la columna de atributos compartida del holograma (desktop y móvil).
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { CardHologramStatColumn } from "./CardHologramStatColumn";
import { ICard } from "@/core/entities/ICard";

const baseCard: ICard = {
  id: "test-card-column",
  name: "Gemini 1.5 Pro",
  description: "Modelo de Google",
  type: "ENTITY",
  faction: "BIG_TECH",
  cost: 7,
  attack: 2500,
  defense: 2000,
  archetype: "LLM",
  renderUrl: "/assets/renders/gemini.webp",
};

describe("CardHologramStatColumn", () => {
  it("muestra coste, ataque y defensa con el tamaño grande (text-6xl) del desktop", () => {
    render(<CardHologramStatColumn card={baseCard} isExecution={false} />);
    const attack = screen.getByText("2500");
    expect(attack).toBeInTheDocument();
    // El tamaño grande es lo que hace legible la lectura en móvil (igual que en desktop).
    expect(attack.className).toContain("text-6xl");
    expect(screen.getByText("7")).toBeInTheDocument();
    expect(screen.getByText("2000")).toBeInTheDocument();
  });

  it("en la variante compact (móvil) mantiene números grandes y legibles con espaciado más ajustado", () => {
    const { container } = render(<CardHologramStatColumn card={baseCard} isExecution={false} variant="compact" />);
    // Los números son aún más grandes que en desktop (text-7xl) para leerse bien en el tablero móvil...
    expect(screen.getByText("2500").className).toContain("text-7xl");
    // ...pero la columna usa un espaciado más ajustado para caber bajo la imagen.
    expect((container.firstChild as HTMLElement).className).toContain("gap-1.5");
  });

  it("en ejecuciones oculta ATK/DEF y solo muestra el coste", () => {
    render(<CardHologramStatColumn card={{ ...baseCard, type: "EXECUTION" }} isExecution />);
    expect(screen.getByText("7")).toBeInTheDocument();
    expect(screen.queryByText("2500")).not.toBeInTheDocument();
    expect(screen.queryByText("2000")).not.toBeInTheDocument();
  });

  it("aplica el posicionamiento recibido (para diferenciar full de lite)", () => {
    const { container } = render(
      <CardHologramStatColumn card={baseCard} isExecution={false} className="custom-anchor" />,
    );
    expect(container.querySelector(".custom-anchor")).not.toBeNull();
  });
});
