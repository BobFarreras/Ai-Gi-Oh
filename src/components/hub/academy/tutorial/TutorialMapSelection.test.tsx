// src/components/hub/academy/tutorial/TutorialMapSelection.test.tsx - Comprueba guía inicial de BigLog y selección exclusiva de Preparar Deck.
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { TutorialMapSelection } from "@/components/hub/academy/tutorial/TutorialMapSelection";

describe("TutorialMapSelection", () => {
  it("fuerza guía inicial dejando solo un nodo seleccionable", () => {
    render(
      <TutorialMapSelection
        nodes={[
          { id: "tutorial-arsenal-basics", order: 1, title: "Preparar Deck", description: "Desc A", kind: "ARSENAL", href: "/a", state: "AVAILABLE" },
          { id: "tutorial-market-basics", order: 2, title: "Market", description: "Desc B", kind: "MARKET", href: "/b", state: "AVAILABLE" },
        ]}
      />,
    );
    const targetLink = screen.getByRole("link", { name: /Abrir Preparar Deck/i });
    expect(targetLink).toHaveAttribute("href", "/a");
  });
});
