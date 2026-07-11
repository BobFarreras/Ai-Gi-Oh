// src/components/hub/home/HomeEvolutionOverlay.test.tsx - Verifica render del overlay de evolución en casos base.
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { HomeEvolutionOverlay } from "@/components/hub/home/HomeEvolutionOverlay";

const SAMPLE_CARD = {
  id: "entity-python",
  name: "Python",
  description: "Carta de prueba",
  type: "ENTITY" as const,
  faction: "NEUTRAL" as const,
  cost: 3,
  attack: 1200,
  defense: 900,
};

describe("HomeEvolutionOverlay", () => {
  it("no renderiza nada sin carta", () => {
    const { container } = render(
      <HomeEvolutionOverlay card={null} fromVersionTier={1} toVersionTier={2} level={3} consumedCopies={4} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("muestra mensaje de copias consumidas al evolucionar", () => {
    render(
      <HomeEvolutionOverlay
        card={{
          id: "entity-python",
          name: "Python",
          description: "Carta de prueba",
          type: "ENTITY",
          faction: "NEUTRAL",
          cost: 3,
          attack: 1200,
          defense: 900,
        }}
        fromVersionTier={2}
        toVersionTier={3}
        level={5}
        consumedCopies={8}
      />,
    );
    expect(screen.getByText("Fusión de 8 copias completada")).toBeInTheDocument();
  });

  it("no muestra el botón de volver si no se pasa onClose", () => {
    render(<HomeEvolutionOverlay card={SAMPLE_CARD} fromVersionTier={2} toVersionTier={3} level={5} consumedCopies={8} />);
    expect(screen.queryByRole("button", { name: /volver a arsenal/i })).not.toBeInTheDocument();
  });

  it("invoca onClose al pulsar 'Volver a Arsenal'", () => {
    const onClose = vi.fn();
    render(<HomeEvolutionOverlay card={SAMPLE_CARD} fromVersionTier={2} toVersionTier={3} level={5} consumedCopies={8} onClose={onClose} />);
    fireEvent.click(screen.getByRole("button", { name: /volver a arsenal/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
