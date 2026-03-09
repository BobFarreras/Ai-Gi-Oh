// src/components/game/board/Board.history-toggle.test.tsx - Verifica apertura de historial desde controles mobile del tablero.
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Board } from "@/components/game/board";
import * as useBoardModule from "@/components/game/board/hooks/useBoard";
import { mockDefaultUseBoardReturn } from "@/components/game/board/board-test-fixtures";

vi.mock("@/components/game/board/hooks/useBoard", () => ({ useBoard: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));

describe("Board historial", () => {
  beforeEach(() => {
    mockDefaultUseBoardReturn();
  });

  it("abre historial con updater toggle", () => {
    const setIsHistoryOpenMock = vi.fn();
    vi.mocked(useBoardModule.useBoard).mockReturnValue({
      ...vi.mocked(useBoardModule.useBoard)(),
      isHistoryOpen: false,
      setIsHistoryOpen: setIsHistoryOpenMock,
    });

    render(<Board />);
    fireEvent.click(screen.getByRole("button", { name: /abrir acciones/i }));
    fireEvent.click(screen.getByRole("button", { name: /abrir historial/i }));

    expect(setIsHistoryOpenMock).toHaveBeenCalledTimes(1);
    const updater = setIsHistoryOpenMock.mock.calls[0][0];
    expect(typeof updater).toBe("function");
    expect(updater(false)).toBe(true);
  });
});
