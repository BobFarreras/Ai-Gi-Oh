// src/components/hub/HubScene.tour.test.tsx - Valida el comportamiento del tour guiado del Hub: nodos desactivados y diálogo de BigLog.
import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { HubScene } from "./HubScene";
import { HUB_NODE_TARGETING_MS } from "@/components/hub/internal/hub-node-navigation-timings";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh: vi.fn() }),
}));

describe("HubScene tour", () => {
  it("desactiva nodos no activos y muestra guía de BigLog cuando el tour está activo", () => {
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

    expect(screen.getByRole("button", { name: "Abrir Mercado" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Arsenal no disponible durante el tutorial" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Guía del tour de BigLog" })).toBeInTheDocument();
    expect(screen.getByText("Ve al nodo Market para aprender a comprar cartas y sobres.")).toBeInTheDocument();
  });

  it("avanza al nodo activo del tour cuando se hace clic", async () => {
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

      fireEvent.click(screen.getByRole("button", { name: "Abrir Mercado" }));
      await act(async () => {
        await vi.advanceTimersByTimeAsync(HUB_NODE_TARGETING_MS + 50);
      });
      expect(push).toHaveBeenCalledWith("/hub/academy/tutorial/market?returnTo=hub");
    } finally {
      vi.useRealTimers();
    }
  });
});
