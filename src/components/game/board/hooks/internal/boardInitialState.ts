// src/components/game/board/hooks/internal/boardInitialState.ts - Construye estado inicial del tablero con mazo persistido opcional.
import { GameEngine, GameState } from "@/core/use-cases/GameEngine";
import { ICard } from "@/core/entities/ICard";
import { IMatchMode } from "@/core/entities/match";
import { createBoardMatchConfig } from "./match/create-board-match-config";

export interface ICreateInitialBoardStateInput {
  mode?: IMatchMode;
  playerDeck?: ICard[] | null;
  playerFusionDeck?: ICard[] | null;
  opponentDeck?: ICard[] | null;
  opponentFusionDeck?: ICard[] | null;
  seed?: string;
  playerId?: string;
  playerName?: string;
  opponentId?: string;
  opponentName?: string;
  starterPlayerId?: string;
  openingHandSize?: number;
}

export function createInitialBoardState(input?: ICreateInitialBoardStateInput): GameState {
  const matchConfig = createBoardMatchConfig(input);
  const baseState = GameEngine.createInitialGameState({
    playerA: {
      id: matchConfig.playerA.id,
      name: matchConfig.playerA.name,
      deck: matchConfig.playerA.deck,
      fusionDeck: matchConfig.playerA.fusionDeck,
    },
    playerB: {
      id: matchConfig.playerB.id,
      name: matchConfig.playerB.name,
      deck: matchConfig.playerB.deck,
      fusionDeck: matchConfig.playerB.fusionDeck,
    },
    starterPlayerId: matchConfig.starterPlayerId,
    openingHandSize: matchConfig.openingHandSize,
    randomSource: matchConfig.randomSource,
  });

  return baseState;
}
