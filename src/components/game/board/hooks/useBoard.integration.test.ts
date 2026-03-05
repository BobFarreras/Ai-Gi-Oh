// src/components/game/board/hooks/useBoard.integration.test.ts - Pruebas de integración del hook principal del tablero.
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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

  it("debería jugar una carta válida desde la mano del jugador", async () => {
    const { result } = renderHook(() => useBoard());
    let playableCard =
      result.current.gameState.playerA.hand.find((card) => card.type === "ENTITY") ??
      result.current.gameState.playerA.hand.find(
        (card) =>
          card.type === "EXECUTION" &&
          card.effect !== undefined &&
          (card.effect.action === "DAMAGE" || card.effect.action === "HEAL" || card.effect.action === "DRAW_CARD"),
      );

    for (let attempt = 0; attempt < 8 && !playableCard; attempt += 1) {
      act(() => {
        result.current.restartMatch();
      });
      playableCard =
        result.current.gameState.playerA.hand.find((card) => card.type === "ENTITY") ??
        result.current.gameState.playerA.hand.find(
          (card) =>
            card.type === "EXECUTION" &&
            card.effect !== undefined &&
            (card.effect.action === "DAMAGE" || card.effect.action === "HEAL" || card.effect.action === "DRAW_CARD"),
        );
    }

    expect(playableCard).toBeDefined();
    if (!playableCard) {
      throw new Error("La mano inicial debe incluir al menos una carta ENTITY o EXECUTION.");
    }
    act(() => {
      result.current.toggleCardSelection(playableCard, createMouseEvent());
    });

    await act(async () => {
      const mode = playableCard.type === "ENTITY" ? "ATTACK" : "ACTIVATE";
      const pendingAction = result.current.executePlayAction(mode, createMouseEvent());
      await vi.advanceTimersByTimeAsync(1500);
      await pendingAction;
    });

    expect(result.current.gameState.playerA.hand.some((card) => card.id === playableCard.id)).toBe(false);
    if (playableCard.type === "ENTITY") {
      expect(result.current.gameState.playerA.activeEntities.some((entity) => entity.card.id === playableCard.id)).toBe(true);
    } else {
      expect(result.current.gameState.playerA.graveyard.some((card) => card.id === playableCard.id)).toBe(true);
    }
  });

  it("debería bloquear ataque directo del jugador inicial durante el primer turno", async () => {
    const { result } = renderHook(() => useBoard());
    let entityCard = result.current.gameState.playerA.hand.find((card) => card.type === "ENTITY");
    for (let attempt = 0; attempt < 8 && !entityCard; attempt += 1) {
      act(() => {
        result.current.restartMatch();
      });
      entityCard = result.current.gameState.playerA.hand.find((card) => card.type === "ENTITY");
    }

    expect(entityCard).toBeDefined();
    if (!entityCard) {
      throw new Error("No se encontró entidad en mano tras varios reinicios de prueba.");
    }

    act(() => {
      result.current.toggleCardSelection(entityCard, createMouseEvent());
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

    await act(async () => {
      const pendingAction = result.current.handleEntityClick(null, true, createMouseEvent());
      await pendingAction;
    });

    expect(result.current.gameState.playerB.healthPoints).toBe(8000);
    expect(result.current.lastError?.code).toBe("GAME_RULE_ERROR");
    expect(result.current.lastError?.message).toContain("no puede atacar durante el primer turno");
    expect(result.current.activeAttackerId).toBeNull();
  });

  it("debería bloquear acciones cuando no es el turno del jugador", async () => {
    const { result } = renderHook(() => useBoard());
    const card = result.current.gameState.playerA.hand[0];

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

  it("debería cambiar a DEFENSE al pulsar dos veces la misma entidad atacante en BATTLE", async () => {
    const { result } = renderHook(() => useBoard());
    let entityCard = result.current.gameState.playerA.hand.find((card) => card.type === "ENTITY");
    for (let attempt = 0; attempt < 8 && !entityCard; attempt += 1) {
      act(() => {
        result.current.restartMatch();
      });
      entityCard = result.current.gameState.playerA.hand.find((card) => card.type === "ENTITY");
    }
    expect(entityCard).toBeDefined();
    if (!entityCard) {
      throw new Error("Se requiere una entidad en mano para este test.");
    }

    act(() => {
      result.current.toggleCardSelection(entityCard, createMouseEvent());
    });
    await act(async () => {
      await result.current.executePlayAction("ATTACK", createMouseEvent());
    });
    act(() => {
      result.current.advancePhase();
    });

    const summoned = result.current.gameState.playerA.activeEntities[0];
    expect(summoned).toBeDefined();
    if (!summoned) {
      throw new Error("La entidad invocada no está disponible.");
    }

    await act(async () => {
      await result.current.handleEntityClick(summoned, false, createMouseEvent());
    });
    expect(result.current.activeAttackerId).toBe(summoned.instanceId);

    await act(async () => {
      await result.current.handleEntityClick(summoned, false, createMouseEvent());
    });

    const updated = result.current.gameState.playerA.activeEntities.find((entity) => entity.instanceId === summoned.instanceId);
    expect(updated?.mode).toBe("DEFENSE");
    expect(result.current.activeAttackerId).toBeNull();
  });
});
