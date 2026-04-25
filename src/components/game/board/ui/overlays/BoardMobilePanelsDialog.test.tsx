// src/components/game/board/ui/overlays/BoardMobilePanelsDialog.test.tsx - Verifica decisión de trampa en diálogo móvil sin bloquear banners centrales.
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { BoardMobilePanelsDialog } from "@/components/game/board/ui/overlays/BoardMobilePanelsDialog";
import { boardMockGameState } from "@/components/game/board/board-test-fixtures";
import { ITrapActivationPrompt } from "@/components/game/board/hooks/internal/board-state/useBoardUiState";

const pathnameMock = vi.fn<() => string | null>(() => "/hub/academy/training/arena");

vi.mock("next/navigation", () => ({
  usePathname: () => pathnameMock(),
}));

vi.mock("@/components/game/card/Card", () => ({
  Card: ({ card }: { card: { name: string } }) => <div>{card.name}</div>,
}));

vi.mock("@/components/game/board/ui/CombatLogEventRow", () => ({
  CombatLogEventRow: () => <div>log-row</div>,
}));

function createTrapPrompt(): ITrapActivationPrompt {
  return {
    trigger: "ON_OPPONENT_ATTACK_DECLARED",
    trapCard: {
      id: "trap-mobile-1",
      name: "Proxy Firewall Trap",
      description: "Cancela ataque rival",
      type: "TRAP",
      faction: "OPEN_SOURCE",
      cost: 1,
      effect: { action: "NEGATE_ATTACK_AND_DESTROY_ATTACKER" },
    },
  };
}

describe("BoardMobilePanelsDialog", () => {
  it("expone activar/cancelar cuando hay prompt de trampa en móvil", () => {
    pathnameMock.mockReturnValue("/hub/academy/training/arena");
    const onActivatePendingTrap = vi.fn();
    const onSkipPendingTrap = vi.fn();

    render(
      <BoardMobilePanelsDialog
        selectedCard={null}
        gameState={boardMockGameState}
        isHistoryOpen={false}
        pendingTrapActivationPrompt={createTrapPrompt()}
        onSelectCard={() => undefined}
        onCloseCard={() => undefined}
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
        selectedCard={null}
        gameState={boardMockGameState}
        isHistoryOpen={false}
        pendingTrapActivationPrompt={createTrapPrompt()}
        onSelectCard={() => undefined}
        onCloseCard={() => undefined}
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
});
