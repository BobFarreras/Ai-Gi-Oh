// src/components/game/board/hooks/useBoard.turn-guard.integration.test.ts - Valida avisos de ayuda de fase y opción persistente para no volver a mostrar.
import { act, renderHook } from "@testing-library/react";
import { ICard } from "@/core/entities/ICard";
import { useBoard } from "./useBoard";

const LOW_COST_ENTITY: ICard = {
  id: "entity-test-low",
  name: "Entity Test",
  description: "Carta de test para guardas de fase.",
  type: "ENTITY",
  faction: "OPEN_SOURCE",
  cost: 1,
  attack: 800,
  defense: 900,
};

describe("useBoard turn-guard integración", () => {
  beforeEach(() => {
    window.localStorage.setItem("board-turn-help", "1");
    window.localStorage.setItem("board-auto-phase", "1");
  });

  it("muestra aviso al intentar avanzar desde MAIN si aún hay acciones", () => {
    const deck = Array.from({ length: 20 }, () => LOW_COST_ENTITY);
    const { result } = renderHook(() => useBoard(deck));
    expect(result.current.gameState.phase).toBe("MAIN_1");
    act(() => {
      result.current.advancePhase();
    });
    expect(result.current.pendingAdvanceWarning).toBe("MAIN_SKIP_ACTIONS");
    expect(result.current.gameState.phase).toBe("MAIN_1");
  });

  it("permite confirmar avance y desactivar avisos futuros", () => {
    const deck = Array.from({ length: 20 }, () => LOW_COST_ENTITY);
    const { result } = renderHook(() => useBoard(deck));
    act(() => {
      result.current.advancePhase();
    });
    expect(result.current.pendingAdvanceWarning).toBe("MAIN_SKIP_ACTIONS");
    act(() => {
      result.current.confirmAdvancePhase(true);
    });
    expect(result.current.pendingAdvanceWarning).toBeNull();
    expect(window.localStorage.getItem("board-turn-help")).toBe("0");
  });

  it("no muestra diálogo de ayuda cuando el avance viene por tiempo agotado", () => {
    const deck = Array.from({ length: 20 }, () => LOW_COST_ENTITY);
    const { result } = renderHook(() => useBoard(deck));
    expect(result.current.gameState.phase).toBe("MAIN_1");
    act(() => {
      result.current.handleTimerExpired();
    });
    expect(result.current.pendingAdvanceWarning).toBeNull();
    expect(result.current.gameState.phase).toBe("BATTLE");
  });
});
