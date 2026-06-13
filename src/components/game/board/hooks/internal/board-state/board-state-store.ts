// src/components/game/board/hooks/internal/board-state/board-state-store.ts - Store Zustand local por instancia para el estado de juego del tablero, base de las suscripciones por selector.
import { useState } from "react";
import { useStore } from "zustand";
import { createStore, StoreApi } from "zustand/vanilla";
import { GameState } from "@/core/use-cases/GameEngine";

export interface IBoardStateStore {
  gameState: GameState;
}

export type BoardStateStoreApi = StoreApi<IBoardStateStore>;

/** Crea un store vanilla con el estado de juego inicial (una instancia por duelo). */
export function createBoardStateStore(initialGameState: GameState): BoardStateStoreApi {
  return createStore<IBoardStateStore>(() => ({ gameState: initialGameState }));
}

/** Hook que crea y conserva el store local durante la vida del componente. */
export function useLocalBoardStateStore(createInitialGameState: () => GameState): BoardStateStoreApi {
  const [store] = useState<BoardStateStoreApi>(() => createBoardStateStore(createInitialGameState()));
  return store;
}

/** Suscripción granular al store: el componente solo re-renderiza si cambia lo que selecciona. */
export function useBoardStateSelector<T>(store: BoardStateStoreApi, selector: (state: IBoardStateStore) => T): T {
  return useStore(store, selector);
}
