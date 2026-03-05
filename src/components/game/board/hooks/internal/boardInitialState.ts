// src/components/game/board/hooks/internal/boardInitialState.ts - Construye estado inicial del tablero con mazo persistido opcional.
import { GameEngine, GameState } from "@/core/use-cases/GameEngine";
import { ICard } from "@/core/entities/ICard";
import { createPlayerDeckA, createPlayerDeckB } from "./initialDeckFactory";

interface ICreateInitialBoardStateInput {
  playerDeck?: ICard[] | null;
}

export function createInitialBoardState(input?: ICreateInitialBoardStateInput): GameState {
  const playerDeck = input?.playerDeck && input.playerDeck.length > 0 ? input.playerDeck : createPlayerDeckA();
  const baseState = GameEngine.createInitialGameState({
    playerA: {
      id: "p1",
      name: "Neo (Tú)",
      deck: playerDeck,
    },
    playerB: {
      id: "p2",
      name: "Agente Smith",
      deck: createPlayerDeckB(),
    },
    starterPlayerId: "p1",
    openingHandSize: 4,
  });

  return baseState;
}
