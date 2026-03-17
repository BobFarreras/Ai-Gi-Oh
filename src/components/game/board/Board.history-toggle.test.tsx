// src/components/game/board/Board.history-toggle.test.tsx - Verifica apertura de historial desde controles mobile del tablero.
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Board } from "@/components/game/board";
import * as useBoardModule from "@/components/game/board/hooks/useBoard";

vi.mock("@/components/game/board/hooks/useBoard", () => ({ useBoard: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("@/components/game/board/internal/use-board-screen-state", () => ({
  useBoardScreenState: () => ({ isResultVisible: false, duelResultRewardSummary: null }),
}));
vi.mock("@/components/game/board/hooks/internal/layout/use-board-viewport-mode", () => ({
  useBoardViewportMode: () => ({ isMobile: true }),
}));
vi.mock("@/components/game/board/internal/use-board-performance-profile", () => ({
  useBoardPerformanceProfile: () => ({ shouldReduceCombatEffects: true }),
}));
vi.mock("@/components/game/board/internal/BoardStatusAndTopBarSection", () => ({
  BoardStatusAndTopBarSection: () => null,
}));
vi.mock("@/components/game/board/internal/BoardPlayersSection", () => ({
  BoardPlayersSection: () => null,
}));
vi.mock("@/components/game/board/internal/BoardInteractiveSection", () => ({
  BoardInteractiveSection: () => null,
}));
vi.mock("@/components/game/board/internal/BoardActionControlsSection", () => ({
  BoardActionControlsSection: ({ board }: { board: { setIsHistoryOpen: (value: (previous: boolean) => boolean) => void } }) => (
    <div>
      <button aria-label="Abrir acciones">Acciones</button>
      <button
        aria-label="Abrir historial"
        onClick={() => board.setIsHistoryOpen((previous) => !previous)}
      >
        Historial
      </button>
    </div>
  ),
}));
vi.mock("@/components/game/board/ui/DuelResultOverlay", () => ({ DuelResultOverlay: () => null }));

function createUseBoardMock(setIsHistoryOpen: (value: (previous: boolean) => boolean) => void): ReturnType<typeof useBoardModule.useBoard> {
  return {
    gameState: {
      playerA: { id: "p1", name: "Boby Master", graveyard: [], destroyedPile: [], activeEntities: [], activeExecutions: [] },
      playerB: { id: "p2", name: "AI Overlord", graveyard: [], destroyedPile: [], activeEntities: [], activeExecutions: [] },
    },
    isPlayerTurn: true,
    clearSelection: vi.fn(),
    winnerPlayerId: null,
    battleExperienceSummary: [],
    battleExperienceCardLookup: {},
    isBattleExperiencePending: false,
    restartMatch: vi.fn(),
    setIsHistoryOpen,
  } as unknown as ReturnType<typeof useBoardModule.useBoard>;
}

describe("Board historial", () => {
  beforeEach(() => {
    vi.mocked(useBoardModule.useBoard).mockReturnValue(createUseBoardMock(vi.fn()));
  });

  it("abre historial con updater toggle", () => {
    const setIsHistoryOpenMock = vi.fn();
    vi.mocked(useBoardModule.useBoard).mockReturnValue(createUseBoardMock(setIsHistoryOpenMock));

    render(<Board />);
    fireEvent.click(screen.getByRole("button", { name: /abrir acciones/i }));
    fireEvent.click(screen.getByRole("button", { name: /abrir historial/i }));

    expect(setIsHistoryOpenMock).toHaveBeenCalledTimes(1);
    const updater = setIsHistoryOpenMock.mock.calls[0][0];
    expect(typeof updater).toBe("function");
    expect(updater(false)).toBe(true);
  });
});
