// src/components/game/board/ui/overlays/PauseOverlay.test.tsx - Verifica renderizado y acción de reanudar del overlay de pausa.
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PauseOverlay } from "./PauseOverlay";

describe("PauseOverlay", () => {
  it("no debería renderizar cuando no está en pausa", () => {
    render(<PauseOverlay isPaused={false} onResume={vi.fn()} />);
    expect(screen.queryByText("Partida detenida")).not.toBeInTheDocument();
  });

  it("debería ejecutar onResume al pulsar reanudar", () => {
    const onResume = vi.fn();
    render(<PauseOverlay isPaused onResume={onResume} />);
    fireEvent.click(screen.getByRole("button", { name: "Reanudar partida" }));
    expect(onResume).toHaveBeenCalledTimes(1);
  });
});
