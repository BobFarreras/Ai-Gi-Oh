// src/components/game/board/ui/overlays/BoardMobilePanelsDialog.test.tsx - Verifica decisión de trampa e inspección de cartas del log en el diálogo móvil.
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { BoardMobilePanelsDialog } from "@/components/game/board/ui/overlays/BoardMobilePanelsDialog";
import { boardMockGameState } from "@/components/game/board/board-test-fixtures";
import { GameState } from "@/core/use-cases/GameEngine";
import { ITrapActivationPrompt } from "@/components/game/board/hooks/internal/board-state/useBoardUiState";

const pathnameMock = vi.fn<() => string | null>(() => "/hub/academy/training/arena/classic");

vi.mock("next/navigation", () => ({
  usePathname: () => pathnameMock(),
}));

vi.mock("@/components/game/card/Card", () => ({
  Card: ({ card }: { card: { name: string } }) => <div>{card.name}</div>,
}));

// Simula una fila del log que expone un botón para inspeccionar su primera carta.
vi.mock("@/components/game/board/ui/CombatLogEventRow", () => ({
  CombatLogEventRow: ({ onCardClick, cardLookup }: { onCardClick: (card: unknown) => void; cardLookup: Record<string, unknown> }) => {
    const firstCard = Object.values(cardLookup)[0];
    return (
      <button type="button" onClick={() => onCardClick(firstCard)}>
        inspeccionar-carta-log
      </button>
    );
  },
}));

function createTrapPrompt(): ITrapActivationPrompt {
  const trapCard = {
    id: "trap-mobile-1",
    name: "Proxy Firewall Trap",
    description: "Cancela ataque rival",
    type: "TRAP" as const,
    faction: "OPEN_SOURCE" as const,
    cost: 1,
    effect: { action: "NEGATE_ATTACK_AND_DESTROY_ATTACKER" as const },
  };
  return {
    trigger: "ON_OPPONENT_ATTACK_DECLARED",
    trapCard,
    eligibleTraps: [{ card: trapCard, instanceId: "trap-mobile-1-inst" }],
    currentIndex: 0,
  };
}

describe("BoardMobilePanelsDialog", () => {
  it("expone activar/cancelar cuando hay prompt de trampa en móvil", () => {
    pathnameMock.mockReturnValue("/hub/academy/training/arena/classic");
    const onActivatePendingTrap = vi.fn();
    const onSkipPendingTrap = vi.fn();

    render(
      <BoardMobilePanelsDialog
        gameState={boardMockGameState}
        isHistoryOpen={false}
        pendingTrapActivationPrompt={createTrapPrompt()}
        onCloseHistory={() => undefined}
        onActivatePendingTrap={onActivatePendingTrap}
        onSkipPendingTrap={onSkipPendingTrap}
      />,
    );

    expect(screen.getAllByText("Proxy Firewall Trap").length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("button", { name: "Activar trampa pendiente" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancelar trampa pendiente" }));

    expect(onActivatePendingTrap).toHaveBeenCalledTimes(1);
    expect(onSkipPendingTrap).toHaveBeenCalledTimes(1);
  });

  it("bloquea cancelar en tutorial guiado", () => {
    pathnameMock.mockReturnValue("/hub/academy/training/tutorial");
    const onSkipPendingTrap = vi.fn();

    render(
      <BoardMobilePanelsDialog
        gameState={boardMockGameState}
        isHistoryOpen={false}
        pendingTrapActivationPrompt={createTrapPrompt()}
        onCloseHistory={() => undefined}
        onActivatePendingTrap={() => undefined}
        onSkipPendingTrap={onSkipPendingTrap}
      />,
    );

    const cancelButton = screen.getByRole("button", { name: "Cancelar trampa pendiente" });
    expect(cancelButton).toBeDisabled();
    fireEvent.click(cancelButton);
    expect(onSkipPendingTrap).not.toHaveBeenCalled();
  });

  it("abre el detalle al tocar una carta del combat log y lo cierra con la X", () => {
    pathnameMock.mockReturnValue("/hub/academy/training/arena/classic");
    const gameStateWithLog: GameState = {
      ...boardMockGameState,
      combatLog: [
        { id: "e1", turn: 1, actorPlayerId: "p1", eventType: "BATTLE_RESOLVED", payload: {} },
      ] as unknown as GameState["combatLog"],
    };

    render(
      <BoardMobilePanelsDialog
        gameState={gameStateWithLog}
        isHistoryOpen
        pendingTrapActivationPrompt={null}
        onCloseHistory={() => undefined}
      />,
    );

    // Sin inspección todavía: no hay panel de detalle (botón cerrar detalle).
    expect(screen.queryByRole("button", { name: "Cerrar detalle" })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "inspeccionar-carta-log" }));

    // El detalle aparece con su botón de cierre.
    const closeDetail = screen.getByRole("button", { name: "Cerrar detalle" });
    expect(closeDetail).toBeInTheDocument();

    fireEvent.click(closeDetail);
    expect(screen.queryByRole("button", { name: "Cerrar detalle" })).toBeNull();
  });
});
