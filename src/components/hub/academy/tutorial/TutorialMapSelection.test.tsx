// src/components/hub/academy/tutorial/TutorialMapSelection.test.tsx - Comprueba render y bloqueo de nodos del mapa tutorial.
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { TutorialMapSelection } from "@/components/hub/academy/tutorial/TutorialMapSelection";

describe("TutorialMapSelection", () => {
  it("renderiza estado bloqueado y acciones de inicio/revisión", () => {
    render(
      <TutorialMapSelection
        nodes={[
          { id: "a", order: 1, title: "Nodo A", description: "Desc A", kind: "ARSENAL", href: "/a", state: "AVAILABLE" },
          { id: "b", order: 2, title: "Nodo B", description: "Desc B", kind: "MARKET", href: "/b", state: "LOCKED" },
        ]}
      />,
    );
    expect(screen.getByRole("link", { name: "Iniciar Nodo A" })).toHaveAttribute("href", "/a");
    expect(screen.getByText("Bloqueado")).toBeInTheDocument();
  });
});
