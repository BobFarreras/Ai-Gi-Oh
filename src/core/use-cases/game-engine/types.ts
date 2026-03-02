import { IPlayer } from "../../entities/IPlayer";

export type TurnPhase = "DRAW" | "MAIN_1" | "BATTLE" | "MAIN_2" | "END";

export interface GameState {
  playerA: IPlayer;
  playerB: IPlayer;
  activePlayerId: string;
  startingPlayerId: string;
  turn: number;
  phase: TurnPhase;
  hasNormalSummonedThisTurn: boolean;
}
