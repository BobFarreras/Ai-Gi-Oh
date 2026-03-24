// src/components/game/board/Board.hud-and-phase.test.tsx - Verifica HUD y controles de fase del tablero con hook mockeado.
import { render, screen } from "@testing-library/react";
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
  BoardStatusAndTopBarSection: ({ player, opponent }: { player: { name: string }; opponent: { name: string } }) => (
    <div>
      <span>{player.name}</span>
      <span>{opponent.name}</span>
    </div>
  ),
}));
vi.mock("@/components/game/board/internal/BoardPlayersSection", () => ({ BoardPlayersSection: () => null }));
vi.mock("@/components/game/board/internal/BoardInteractiveSection", () => ({ BoardInteractiveSection: () => null }));
vi.mock("@/components/game/board/internal/BoardActionControlsSection", () => ({
  BoardActionControlsSection: ({ board }: { board: { isPlayerTurn: boolean } }) => (
    <div>
      <button aria-label="Fase invocar" disabled>
        Invocar
      </button>
      <button aria-label="Pasar a combate" disabled={!board.isPlayerTurn}>
        Combate
      </button>
      <button aria-label="Pasar turno" disabled={!board.isPlayerTurn}>
        Pasar
      </button>
    </div>
  ),
}));
vi.mock("@/components/game/board/ui/DuelResultOverlay", () => ({ DuelResultOverlay: () => null }));

function createUseBoardMock(isPlayerTurn = true): ReturnType<typeof useBoardModule.useBoard> {
  return {
    gameState: {
      playerA: { id: "p1", name: "Boby Master", graveyard: [], destroyedPile: [], activeEntities: [], activeExecutions: [] },
      playerB: { id: "p2", name: "AI Overlord", graveyard: [], destroyedPile: [], activeEntities: [], activeExecutions: [] },
    },
    isPlayerTurn,
    clearSelection: vi.fn(),
    winnerPlayerId: null,
    battleExperienceSummary: [],
    battleExperienceCardLookup: {},
    isBattleExperiencePending: false,
    restartMatch: vi.fn(),
  } as unknown as ReturnType<typeof useBoardModule.useBoard>;
}

describe("Board HUD y fases", () => {
  beforeEach(() => {
    vi.mocked(useBoardModule.useBoard).mockReturnValue(createUseBoardMock(true));
  });

  it("renderiza la información de jugadores en HUD", () => {
    render(<Board />);
    expect(screen.getByText("Boby Master")).toBeInTheDocument();
    expect(screen.getByText("AI Overlord")).toBeInTheDocument();
  });

  it("deshabilita acciones de fase cuando es turno rival", () => {
    vi.mocked(useBoardModule.useBoard).mockReturnValue(createUseBoardMock(false));
    render(<Board />);
    expect(screen.getByRole("button", { name: /fase invocar/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /pasar a combate/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /pasar turno/i })).toBeDisabled();
  });
});
