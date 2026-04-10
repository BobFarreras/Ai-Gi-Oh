// src/components/game/board/hooks/useBoard.battle-position.integration.test.ts - Comprueba cambio de posición en batalla desde SET/DEFENSE hacia ATTACK.
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ENTITY_CARDS } from "@/core/data/mock-cards/entities";
import { useBoard } from "./useBoard";

function createMouseEvent(): React.MouseEvent {
  return { stopPropagation: vi.fn() } as unknown as React.MouseEvent;
}

describe("useBoard cambio de posición en batalla", () => {
  it("no debería pasar automáticamente una entidad en SET a ATTACK al hacer click", async () => {
    window.localStorage.setItem("board-auto-phase", "0");
    const deterministicDeck = ENTITY_CARDS.slice(0, 8).map((card) => ({ ...card }));
    const { result } = renderHook(() =>
      useBoard(deterministicDeck, "TRAINING", {
        preserveDeckOrder: true,
        openingHandSize: 4,
      }),
    );
    const entityCard = result.current.gameState.playerA.hand.find((card) => card.type === "ENTITY");
    expect(entityCard).toBeDefined();
    if (!entityCard) {
      throw new Error("Se requiere una entidad en mano para esta prueba.");
    }

    act(() => {
      result.current.toggleCardSelection(entityCard!, createMouseEvent());
    });
    await act(async () => {
      await result.current.executePlayAction("DEFENSE", createMouseEvent());
    });
    act(() => {
      result.current.advancePhase();
    });

    const defending = result.current.gameState.playerA.activeEntities.find((entity) => entity.card.id === entityCard.id);
    expect(defending?.mode).toBe("SET");
    if (!defending) {
      throw new Error("La entidad invocada no está disponible.");
    }

    await act(async () => {
      await result.current.handleEntityClick(defending, false, createMouseEvent());
    });

    const afterClick = result.current.gameState.playerA.activeEntities.find((entity) => entity.instanceId === defending.instanceId);
    expect(afterClick?.mode).toBe("SET");
    expect(result.current.activeAttackerId).toBeNull();
    expect(result.current.canSetSelectedEntityToAttack).toBe(false);
  });
});
