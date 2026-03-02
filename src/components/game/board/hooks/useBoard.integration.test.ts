import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { IBoardEntity } from "@/core/entities/IPlayer";
import { useBoard } from "./useBoard";

function createMouseEvent(): React.MouseEvent {
  return { stopPropagation: vi.fn() } as unknown as React.MouseEvent;
}

describe("useBoard integración", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("debería activar una ejecución y aplicar su efecto al rival", async () => {
    const { result } = renderHook(() => useBoard());
    const spellCard = result.current.gameState.playerA.hand.find((card) => card.id === "card-spell-ddos");

    expect(spellCard).toBeDefined();
    act(() => {
      result.current.toggleCardSelection(spellCard!, createMouseEvent());
    });

    await act(async () => {
      const pendingAction = result.current.executePlayAction("ACTIVATE", createMouseEvent());
      await vi.advanceTimersByTimeAsync(1500);
      await pendingAction;
    });

    expect(result.current.gameState.playerB.healthPoints).toBe(7000);
    expect(result.current.gameState.playerA.activeExecutions).toHaveLength(0);
    expect(result.current.gameState.playerA.graveyard.some((card) => card.id === "card-spell-ddos")).toBe(true);
  });

  it("debería bloquear ataque del jugador inicial durante el primer turno", async () => {
    const { result } = renderHook(() => useBoard());
    const entityCard = result.current.gameState.playerA.hand.find((card) => card.id === "card-p1-gemini");

    expect(entityCard).toBeDefined();

    act(() => {
      result.current.toggleCardSelection(entityCard!, createMouseEvent());
    });

    await act(async () => {
      await result.current.executePlayAction("ATTACK", createMouseEvent());
    });

    act(() => {
      result.current.advancePhase();
    });

    const attacker = result.current.gameState.playerA.activeEntities[0];
    expect(attacker).toBeDefined();

    await act(async () => {
      await result.current.handleEntityClick(attacker, false, createMouseEvent());
    });

    const defender = result.current.gameState.playerB.activeEntities.find(
      (entity) => entity.instanceId === "inst-weak-bug-002",
    ) as IBoardEntity;

    await act(async () => {
      const pendingAction = result.current.handleEntityClick(defender, true, createMouseEvent());
      await vi.advanceTimersByTimeAsync(800);
      await pendingAction;
    });

    expect(result.current.gameState.playerB.activeEntities.some((entity) => entity.instanceId === "inst-weak-bug-002")).toBe(
      true,
    );
    expect(result.current.gameState.playerB.graveyard.some((card) => card.id === "op-weak")).toBe(false);
    expect(result.current.lastError?.code).toBe("GAME_RULE_ERROR");
    expect(result.current.lastError?.message).toContain("no puede atacar durante el primer turno");
    expect(result.current.activeAttackerId).toBeNull();
  });

  it("debería bloquear acciones cuando no es el turno del jugador", async () => {
    const { result } = renderHook(() => useBoard());
    const card = result.current.gameState.playerA.hand.find((currentCard) => currentCard.id === "card-p1-gemini");

    expect(card).toBeDefined();

    act(() => {
      result.current.advancePhase();
      result.current.advancePhase();
      result.current.advancePhase();
      result.current.advancePhase();
    });

    expect(result.current.gameState.activePlayerId).toBe("p2");

    act(() => {
      result.current.toggleCardSelection(card!, createMouseEvent());
    });

    expect(result.current.playingCard).toBeNull();
    expect(result.current.lastError?.code).toBe("GAME_RULE_ERROR");
    expect(result.current.lastError?.message).toContain("No es tu turno");
  });
});
