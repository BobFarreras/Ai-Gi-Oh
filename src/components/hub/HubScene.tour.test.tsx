// src/components/hub/HubScene.tour.test.tsx - Valida el comportamiento del tour guiado del Hub: nodos desactivados y overlay evento de BigLog.
import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { HubScene } from "./HubScene";
import { HUB_NODE_TARGETING_MS } from "@/components/hub/internal/hub-node-navigation-timings";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh: vi.fn() }),
}));

describe("HubScene tour", () => {
  it("muestra overlay evento de BigLog en el paso Market (primera visita)", () => {
    render(
      <HubScene
        forceFallbackForTests
        sections={[
          { id: "market", type: "MARKET", title: "Mercado", description: "Compra.", href: "/hub/market", isLocked: false, lockReason: null },
          { id: "home", type: "HOME", title: "Arsenal", description: "Mazos.", href: "/hub/arsenal", isLocked: false, lockReason: null },
        ]}
        nodes={[
          { id: "node-market", sectionType: "MARKET", districtLabel: "Comercial", positionX: 24, positionY: 58 },
          { id: "node-home", sectionType: "HOME", districtLabel: "Base", positionX: 50, positionY: 70 },
        ]}
        completedTutorialNodeIds={[]}
      />,
    );

    expect(screen.getByRole("region", { name: "Instrucción del tour - BigLog" })).toBeInTheDocument();
    expect(screen.getByText(/Ve al nodo Market para aprender a comprar cartas y sobres/)).toBeInTheDocument();
  });

  it("desactiva nodos no activos e inicia navegación al pulsar Ir", () => {
    render(
      <HubScene
        forceFallbackForTests
        sections={[
          { id: "market", type: "MARKET", title: "Mercado", description: "Compra.", href: "/hub/market", isLocked: false, lockReason: null },
          { id: "home", type: "HOME", title: "Arsenal", description: "Mazos.", href: "/hub/arsenal", isLocked: false, lockReason: null },
        ]}
        nodes={[
          { id: "node-market", sectionType: "MARKET", districtLabel: "Comercial", positionX: 24, positionY: 58 },
          { id: "node-home", sectionType: "HOME", districtLabel: "Base", positionX: 50, positionY: 70 },
        ]}
        completedTutorialNodeIds={[]}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Ir" }));
    expect(screen.getByRole("button", { name: "Conectando con Mercado" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Arsenal no disponible durante el tutorial" })).toBeInTheDocument();
  });

  it("navega al tutorial de Market al pulsar Ir en el overlay", async () => {
    vi.useFakeTimers();
    try {
      render(
        <HubScene
          forceFallbackForTests
          sections={[
            { id: "market", type: "MARKET", title: "Mercado", description: "Compra.", href: "/hub/market", isLocked: false, lockReason: null },
          ]}
          nodes={[{ id: "node-market", sectionType: "MARKET", districtLabel: "Comercial", positionX: 50, positionY: 50 }]}
          completedTutorialNodeIds={[]}
        />,
      );

      fireEvent.click(screen.getByRole("button", { name: "Ir" }));
      await act(async () => {
        await vi.advanceTimersByTimeAsync(HUB_NODE_TARGETING_MS + 50);
      });
      expect(push).toHaveBeenCalledWith("/hub/academy/tutorial/market?returnTo=hub");
    } finally {
      vi.useRealTimers();
    }
  });

  it("muestra el overlay evento al regresar del tutorial de Market (paso Arsenal)", () => {
    render(
      <HubScene
        forceFallbackForTests
        sections={[
          { id: "home", type: "HOME", title: "Arsenal", description: "Mazos.", href: "/hub/arsenal", isLocked: false, lockReason: null },
          { id: "market", type: "MARKET", title: "Mercado", description: "Compra.", href: "/hub/market", isLocked: false, lockReason: null },
        ]}
        nodes={[
          { id: "node-home", sectionType: "HOME", districtLabel: "Base", positionX: 50, positionY: 70 },
          { id: "node-market", sectionType: "MARKET", districtLabel: "Comercial", positionX: 24, positionY: 58 },
        ]}
        completedTutorialNodeIds={["tutorial-market-basics"]}
      />,
    );

    expect(screen.getByRole("region", { name: "Instrucción del tour - BigLog" })).toBeInTheDocument();
    expect(screen.getByText(/Ve al nodo Arsenal para aprender a gestionar cartas/)).toBeInTheDocument();
  });
});
