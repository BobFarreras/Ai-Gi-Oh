// src/core/use-cases/game-engine/state/player-utils.ts - Descripción breve del módulo.
import { IPlayer } from "@/core/entities/IPlayer";
import { ValidationError } from "@/core/errors/ValidationError";
import { GameState } from "@/core/use-cases/game-engine/state/types";

export interface IPlayerPair {
  player: IPlayer;
  opponent: IPlayer;
  isPlayerA: boolean;
}

export function getPlayerPair(state: GameState, playerId: string): IPlayerPair {
  if (state.playerA.id === playerId) {
    return { player: state.playerA, opponent: state.playerB, isPlayerA: true };
  }

  if (state.playerB.id === playerId) {
    return { player: state.playerB, opponent: state.playerA, isPlayerA: false };
  }

  throw new ValidationError("Jugador inválido.");
}

export function assignPlayers(state: GameState, updatedPlayer: IPlayer, updatedOpponent: IPlayer, isPlayerA: boolean): GameState {
  return {
    ...state,
    playerA: isPlayerA ? updatedPlayer : updatedOpponent,
    playerB: isPlayerA ? updatedOpponent : updatedPlayer,
  };
}

