// src/components/game/card/internal/CardFrameArtAndProgress.test.tsx - Badges ×N de objetos aplicados sobre el
// arte de la carta (rastro visible de la ficha 9b).
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CardFrameArtAndProgress } from "./CardFrameArtAndProgress";
import { ICard } from "@/core/entities/ICard";

const baseCard: ICard = {
  id: "test-card-badges",
  name: "Firewall Golem",
  description: "Guardián de la red",
  type: "ENTITY",
  faction: "BIG_TECH",
  cost: 4,
  attack: 1500,
  defense: 1800,
  archetype: "SECURITY",
  renderUrl: "/assets/renders/firewall-golem.webp",
};

function renderArt(upgradeCounts: { attack: number; defense: number } | null) {
  return render(
    <CardFrameArtAndProgress card={baseCard} isOnBoard={false} level={3} levelProgressWidth="40%" upgradeCounts={upgradeCounts} />,
  );
}

describe("CardFrameArtAndProgress (badges de mejoras)", () => {
  it("sin contadores no pinta ningún badge (el tablero de combate nunca los pasa)", () => {
    renderArt(null);
    expect(screen.queryByLabelText(/mejoras? de ataque/)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/mejoras? de defensa/)).not.toBeInTheDocument();
  });

  it("pinta ×N por stat solo cuando hay aplicaciones de ese stat", () => {
    renderArt({ attack: 2, defense: 0 });
    expect(screen.getByLabelText("2 mejoras de ataque")).toHaveTextContent("×2");
    expect(screen.queryByLabelText(/mejoras? de defensa/)).not.toBeInTheDocument();
  });

  it("ATK va a la izquierda y DEF a la derecha del arte", () => {
    renderArt({ attack: 1, defense: 3 });
    expect(screen.getByLabelText("1 mejora de ataque").className).toContain("left-0");
    expect(screen.getByLabelText("3 mejoras de defensa").className).toContain("right-0");
  });

  it("en la carta grande (detalle) el sello muestra el ×N", () => {
    renderArt({ attack: 2, defense: 0 });
    expect(screen.getByLabelText("2 mejoras de ataque")).toHaveTextContent("×2");
  });
});
