// src/components/game/board/hooks/useBoard.defense-set.integration.test.ts - Verifica que invocar entidad en defensa desde mano la coloque en SET.
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useBoard } from "./useBoard";

function createMouseEvent(): React.MouseEvent {
  return { stopPropagation: () => undefined } as unknown as React.MouseEvent;
}

describe("useBoard defensa desde mano", () => {
  it("debería convertir DEFENSE en SET al jugar entidad desde mano", async () => {
    const { result } = renderHook(() => useBoard());
    let entityCard = result.current.gameState.playerA.hand.find((card) => card.type === "ENTITY");
    for (let attempt = 0; attempt < 8 && !entityCard; attempt += 1) {
      act(() => result.current.restartMatch());
      entityCard = result.current.gameState.playerA.hand.find((card) => card.type === "ENTITY");
    }

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

    const summoned = result.current.gameState.playerA.activeEntities.find((entity) => entity.card.id === entityCard.id);
    expect(summoned?.mode).toBe("SET");
  });
});
