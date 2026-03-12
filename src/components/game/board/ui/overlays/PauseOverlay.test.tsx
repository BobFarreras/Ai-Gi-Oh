// src/components/game/board/ui/overlays/PauseOverlay.test.tsx - Verifica renderizado y acción de reanudar del overlay de pausa.
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PauseOverlay } from "./PauseOverlay";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

describe("PauseOverlay", () => {
  it("no debería renderizar cuando no está en pausa", () => {
    render(<PauseOverlay isPaused={false} onResume={vi.fn()} />);
    expect(screen.queryByText("Pausa Táctica")).not.toBeInTheDocument();
  });

  it("debería ejecutar onResume al pulsar reanudar", () => {
    const onResume = vi.fn();
    render(<PauseOverlay isPaused onResume={onResume} />);
    fireEvent.click(screen.getByRole("button", { name: "Reanudar partida" }));
    expect(onResume).toHaveBeenCalledTimes(1);
  });

  it("prioriza callback de salida cuando existe", () => {
    const onExit = vi.fn();
    render(<PauseOverlay isPaused onResume={vi.fn()} onExit={onExit} />);
    fireEvent.click(screen.getByText("Desconectar y Salir"));
    expect(onExit).toHaveBeenCalledTimes(1);
  });
});
