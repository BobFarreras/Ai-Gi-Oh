// src/components/hub/story/internal/map/components/StoryMapZoomControls.test.tsx - Verifica controles de mapa Story para móvil y desktop.
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { StoryMapZoomControls } from "./StoryMapZoomControls";

describe("StoryMapZoomControls", () => {
  it("muestra botón de salida en modo móvil y dispara callback", () => {
    const onExitToHub = vi.fn();
    render(
      <StoryMapZoomControls
        onCenterPlayerNode={() => undefined}
        isSoundtrackMuted={false}
        onToggleSoundtrackMute={() => undefined}
        isMobileVerticalFlow
        onExitToHub={onExitToHub}
      />,
    );
    const exitButton = screen.getByRole("button", { name: "Salir al hub" });
    fireEvent.click(exitButton);
    expect(onExitToHub).toHaveBeenCalledOnce();
  });

  it("no renderiza salida en desktop", () => {
    render(
      <StoryMapZoomControls
        onCenterPlayerNode={() => undefined}
        isSoundtrackMuted={false}
        onToggleSoundtrackMute={() => undefined}
      />,
    );
    expect(screen.queryByRole("button", { name: "Salir al hub" })).not.toBeInTheDocument();
  });
});

