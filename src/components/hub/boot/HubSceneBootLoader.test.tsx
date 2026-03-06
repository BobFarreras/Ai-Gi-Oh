// src/components/hub/boot/HubSceneBootLoader.test.tsx - Valida que el hub muestra loading inicial y monta escena al finalizar la transición.
import { act, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { HUB_BOOT_LOADING_MS, HUB_BOOT_OPENING_MS } from "@/components/hub/internal/hub-boot-timings";
import { HubSceneBootLoader } from "./HubSceneBootLoader";

vi.mock("@/components/hub/HubScene", () => ({
  HubScene: () => <div data-testid="hub-scene">Hub Scene</div>,
}));

describe("HubSceneBootLoader", () => {
  it("mantiene overlay de carga y luego monta la escena", () => {
    vi.useFakeTimers();
    render(
      <HubSceneBootLoader
        playerLabel="neo"
        progress={{ playerId: "neo", medals: 0, storyChapter: 1, hasCompletedTutorial: false }}
        sections={[]}
        nodes={[]}
      />,
    );

    expect(screen.getByText("Inicializando Sala de Control")).toBeInTheDocument();
    expect(screen.queryByTestId("hub-scene")).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(HUB_BOOT_LOADING_MS + HUB_BOOT_OPENING_MS);
    });

    expect(screen.queryByText("Inicializando Sala de Control")).not.toBeInTheDocument();
    expect(screen.getByTestId("hub-scene")).toBeInTheDocument();
    vi.useRealTimers();
  });
});
