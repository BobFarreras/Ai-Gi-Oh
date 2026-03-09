// src/components/game/board/hooks/useBoard.integration.core.test.ts - Cubre flujo base de juego de carta y bloqueo de acciones fuera de turno.
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ICard } from "@/core/entities/ICard";
import { useBoard } from "@/components/game/board/hooks/useBoard";
import { createMouseEvent, integrationEntityCard } from "@/components/game/board/hooks/useBoard.integration.helpers";

describe("useBoard integración core", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    window.localStorage.setItem("board-turn-help", "0");
    window.localStorage.setItem("board-auto-phase", "1");
  });
  afterEach(() => vi.useRealTimers());

  it("juega carta válida desde la mano del jugador", async () => {
    const forcedDeck: ICard[] = Array.from({ length: 20 }, (_, index) => ({
      ...integrationEntityCard,
      id: `${integrationEntityCard.id}-playable-${index}`,
      name: `${integrationEntityCard.name} Playable ${index + 1}`,
      runtimeId: `integration-playable-${index + 1}`,
    }));
    const { result } = renderHook(() => useBoard(forcedDeck));
    const playableCard = result.current.gameState.playerA.hand.find((card) => card.type === "ENTITY");
    expect(playableCard).toBeDefined();
    if (!playableCard) throw new Error("La mano inicial debe incluir ENTITY.");
    act(() => result.current.toggleCardSelection(playableCard, createMouseEvent()));
    await act(async () => {
      const pendingAction = result.current.executePlayAction("ATTACK", createMouseEvent());
      await vi.advanceTimersByTimeAsync(1500);
      await pendingAction;
    });
    expect(result.current.gameState.playerA.hand.some((card) => card.id === playableCard.id)).toBe(false);
    expect(result.current.gameState.playerA.activeEntities.some((entity) => entity.card.id === playableCard.id)).toBe(true);
  });

  it("bloquea acciones cuando no es turno del jugador", () => {
    const { result } = renderHook(() => useBoard());
    const card = result.current.gameState.playerA.hand[0];
    expect(card).toBeDefined();
    act(() => {
      result.current.advancePhase();
      result.current.advancePhase();
      result.current.advancePhase();
      result.current.advancePhase();
    });
    expect(result.current.gameState.activePlayerId).toBe(result.current.gameState.playerB.id);
    act(() => result.current.toggleCardSelection(card!, createMouseEvent()));
    expect(result.current.playingCard).toBeNull();
    expect(result.current.lastError?.code).toBe("GAME_RULE_ERROR");
    expect(result.current.lastError?.message).toContain("No es tu turno");
  });
});
