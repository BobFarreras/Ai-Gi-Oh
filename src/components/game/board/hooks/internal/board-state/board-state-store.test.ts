// src/components/game/board/hooks/internal/board-state/board-state-store.test.ts - Verifica el store local de estado de juego del tablero.
import { describe, expect, it, vi } from "vitest";
import { GameState } from "@/core/use-cases/GameEngine";
import { createBoardStateStore } from "./board-state-store";

/** Estado de juego mínimo para los tests del store (solo lo que el store transporta). */
function createFakeGameState(turn: number): GameState {
  return { turn } as unknown as GameState;
}

describe("board-state-store", () => {
  it("expone el estado de juego inicial", () => {
    const store = createBoardStateStore(createFakeGameState(1));
    expect(store.getState().gameState.turn).toBe(1);
  });

  it("actualiza el estado de juego y notifica a los suscriptores", () => {
    const store = createBoardStateStore(createFakeGameState(1));
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);

    store.setState({ gameState: createFakeGameState(2) });

    expect(store.getState().gameState.turn).toBe(2);
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
  });

  it("mantiene la identidad del estado de juego entre lecturas sin actualizar", () => {
    const initial = createFakeGameState(1);
    const store = createBoardStateStore(initial);

    // Identidad estable: es lo que permite que los selectores memoizados no re-rendericen.
    expect(store.getState().gameState).toBe(initial);
    const next = createFakeGameState(2);
    store.setState({ gameState: next });
    expect(store.getState().gameState).toBe(next);
  });
});
