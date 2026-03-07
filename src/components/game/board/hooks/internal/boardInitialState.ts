// src/components/game/board/hooks/internal/boardInitialState.ts - Construye estado inicial del tablero con mazo persistido opcional.
import { GameEngine, GameState } from "@/core/use-cases/GameEngine";
import { ICard } from "@/core/entities/ICard";
import { createMatchSeed } from "@/core/services/random/create-match-seed";
import { createSeededRandom } from "@/core/services/random/seeded-rng";
import { createPlayerDeckA, createPlayerDeckB, shuffleDeck } from "./initialDeckFactory";

interface ICreateInitialBoardStateInput {
  playerDeck?: ICard[] | null;
  seed?: string;
}

export function createInitialBoardState(input?: ICreateInitialBoardStateInput): GameState {
  const seed = input?.seed ?? createMatchSeed();
  const randomSource = createSeededRandom(seed);
  const playerDeckSource = input?.playerDeck && input.playerDeck.length > 0 ? input.playerDeck : createPlayerDeckA(randomSource);
  const playerDeck = shuffleDeck(playerDeckSource.map((card) => ({ ...card })), randomSource);
  const opponentDeck = createPlayerDeckB(randomSource);
  const baseState = GameEngine.createInitialGameState({
    playerA: {
      id: "p1",
      name: "Neo (Tú)",
      deck: playerDeck,
    },
    playerB: {
      id: "p2",
      name: "Agente Smith",
      deck: opponentDeck,
    },
    starterPlayerId: "p1",
    openingHandSize: 4,
    randomSource,
  });

  return baseState;
}
