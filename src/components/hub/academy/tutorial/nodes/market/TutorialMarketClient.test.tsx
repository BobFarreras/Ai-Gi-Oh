// src/components/hub/academy/tutorial/nodes/market/TutorialMarketClient.test.tsx - Valida el flujo Market tutorial usando UI real con sandbox mock.
import { beforeAll, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { TutorialMarketClient } from "@/components/hub/academy/tutorial/nodes/market/TutorialMarketClient";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
}));

describe("TutorialMarketClient", () => {
  beforeAll(() => {
    if (typeof window.ResizeObserver !== "undefined") return;
    class ResizeObserverMock {
      observe(): void {}
      disconnect(): void {}
      unobserve(): void {}
    }
    Object.defineProperty(window, "ResizeObserver", {
      value: ResizeObserverMock,
      writable: true,
    });
  });

  it("completa el flujo guiado en la UI real del market", async () => {
    render(<TutorialMarketClient />);
    fireEvent.click(screen.getByRole("button", { name: "Empezar" }));

    expect(screen.getByText("Filtro por tipo")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Siguiente paso del tutorial" }));

    expect(await screen.findByText("Ordenar resultados")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Siguiente paso del tutorial" }));

    expect(await screen.findByText("Dirección de orden")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Siguiente paso del tutorial" }));

    expect(await screen.findByText("Comprar carta individual")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Comprar" }));
    await waitFor(() => {
      expect(screen.getByText("Resultado en Almacén")).toBeInTheDocument();
    }, { timeout: 3200 });
    fireEvent.click(screen.getByRole("button", { name: "Siguiente paso del tutorial" }));

    expect(await screen.findByText("Seleccionar Pack GemGPT")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Siguiente paso del tutorial" }));

    expect(await screen.findByText("Detalle del Pack")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Siguiente paso del tutorial" }));

    expect(await screen.findByText("Comprar sobre aleatorio")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Siguiente paso del tutorial" }));
    await waitFor(() => {
      const closeRevealButton = screen.queryByRole("button", { name: "Integrar al Almacén" });
      if (closeRevealButton) fireEvent.click(closeRevealButton);
      const nextStepButton = screen.queryByRole("button", { name: "Siguiente paso del tutorial" });
      if (nextStepButton) fireEvent.click(nextStepButton);
      const isCompleted = Boolean(screen.queryByText("Market Completado"));
      expect(isCompleted).toBe(true);
    }, { timeout: 20000 });

    expect(screen.getByText("Market Completado")).toBeInTheDocument();
  }, 60000);
});
