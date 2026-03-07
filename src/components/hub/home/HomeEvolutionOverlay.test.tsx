// src/components/hub/home/HomeEvolutionOverlay.test.tsx - Verifica render del overlay de evolución en casos base.
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HomeEvolutionOverlay } from "@/components/hub/home/HomeEvolutionOverlay";

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
});
