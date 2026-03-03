import { ICombatLogEvent } from "@/core/entities/ICombatLog";
import { IPlayer } from "@/core/entities/IPlayer";

export type TurnPhase = "MAIN_1" | "BATTLE";

export type PendingTurnActionType = "SACRIFICE_ENTITY_FOR_DRAW" | "DISCARD_FOR_HAND_LIMIT";

export interface IPendingTurnAction {
  type: PendingTurnActionType;
  playerId: string;
}

export interface GameState {
  playerA: IPlayer;
  playerB: IPlayer;
  activePlayerId: string;
  startingPlayerId: string;
  turn: number;
  phase: TurnPhase;
  hasNormalSummonedThisTurn: boolean;
  pendingTurnAction?: IPendingTurnAction | null;
  combatLog: ICombatLogEvent[];
}
