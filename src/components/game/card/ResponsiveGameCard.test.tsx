// src/components/game/card/ResponsiveGameCard.test.tsx - Pruebas del envoltorio que escala la Card al ancho de su contenedor.
import { render, screen } from "@testing-library/react";
import { describe, it, expect, beforeAll, vi } from "vitest";
import { ResponsiveGameCard } from "./ResponsiveGameCard";
import { ICard } from "@/core/entities/ICard";

const mockCard: ICard = {
  id: "test-card-1",
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

beforeAll(() => {
  // ResizeObserver no existe en JSDOM: lo mockeamos disparando la medición al observar.
  class ResizeObserverMock {
    constructor(private readonly callback: ResizeObserverCallback) {}
    observe() {
      this.callback([], this as unknown as ResizeObserver);
    }
    unobserve() {}
    disconnect() {}
  }
  vi.stubGlobal("ResizeObserver", ResizeObserverMock);
  // JSDOM reporta clientWidth 0; forzamos un ancho para verificar el escalado.
  Object.defineProperty(HTMLElement.prototype, "clientWidth", { configurable: true, value: 130 });
});

describe("Componente UI: ResponsiveGameCard", () => {
  it("debería renderizar la Card completa una vez medido el ancho del contenedor", () => {
    render(<ResponsiveGameCard card={mockCard} />);
    expect(screen.getByText("Gemini 1.5 Pro")).toBeInTheDocument();
    expect(screen.getByText("2500")).toBeInTheDocument();
  });

  it("debería escalar la Card por anchoContenedor/260 (130 → scale 0.5)", () => {
    const { container } = render(<ResponsiveGameCard card={mockCard} />);
    const scaled = container.querySelector('[style*="scale(0.5)"]');
    expect(scaled).not.toBeNull();
  });
});
