import { GameEngine, GameState } from "@/core/use-cases/GameEngine";
import { createOpponentInitialEntities, createPlayerDeckA, createPlayerDeckB } from "./initialDeckFactory";

function createInitialBoardState(): GameState {
  const baseState = GameEngine.createInitialGameState({
    playerA: {
      id: "p1",
      name: "Neo (Tú)",
      deck: createPlayerDeckA(),
    },
    playerB: {
      id: "p2",
      name: "Agente Smith",
      deck: createPlayerDeckB(),
    },
    starterPlayerId: "p1",
  });

  return {
    ...baseState,
    playerB: {
      ...baseState.playerB,
      activeEntities: createOpponentInitialEntities(),
    },
  };
}

export const initialGameState: GameState = createInitialBoardState();

