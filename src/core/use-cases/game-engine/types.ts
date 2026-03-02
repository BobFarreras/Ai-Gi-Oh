import { IPlayer } from "../../entities/IPlayer";

export type TurnPhase = "MAIN_1" | "BATTLE";

export interface GameState {
  playerA: IPlayer;
  playerB: IPlayer;
  activePlayerId: string;
  startingPlayerId: string;
  turn: number;
  phase: TurnPhase;
  hasNormalSummonedThisTurn: boolean;
}
