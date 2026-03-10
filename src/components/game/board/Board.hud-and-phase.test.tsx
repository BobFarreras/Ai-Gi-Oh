// src/components/game/board/Board.hud-and-phase.test.tsx - Verifica HUD y controles de fase del tablero con hook mockeado.
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Board } from "@/components/game/board";
import * as useBoardModule from "@/components/game/board/hooks/useBoard";
import { mockDefaultUseBoardReturn } from "@/components/game/board/board-test-fixtures";

vi.mock("@/components/game/board/hooks/useBoard", () => ({ useBoard: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

describe("Board HUD y fases", () => {
  beforeEach(() => {
    mockDefaultUseBoardReturn();
  });

  it("renderiza la información de jugadores en HUD", () => {
    render(<Board />);
    expect(screen.getByText("Boby Master")).toBeInTheDocument();
    expect(screen.getByText("AI Overlord")).toBeInTheDocument();
    expect(screen.getByText(/dificultad easy/i)).toBeInTheDocument();
  });

  it("deshabilita acciones de fase cuando es turno rival", () => {
    vi.mocked(useBoardModule.useBoard).mockReturnValue({
      ...vi.mocked(useBoardModule.useBoard)(),
      isPlayerTurn: false,
    });
    render(<Board />);
    expect(screen.getByRole("button", { name: /fase invocar/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /pasar a combate/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /pasar turno/i })).toBeDisabled();
  });
});
