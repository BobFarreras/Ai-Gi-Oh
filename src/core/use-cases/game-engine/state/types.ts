// src/core/use-cases/game-engine/state/types.ts - Tipos base del estado de partida, fases y acciones pendientes de turno.
import { ICombatLogEvent } from "@/core/entities/ICombatLog";
import { IPlayer } from "@/core/entities/IPlayer";
import type { IGameEngineIdFactory } from "@/core/use-cases/game-engine/state/id-factory";

export type TurnPhase = "MAIN_1" | "BATTLE";

export type PendingTurnActionType =
  | "DISCARD_FOR_HAND_LIMIT"
  | "SELECT_FUSION_MATERIALS"
  | "SELECT_GRAVEYARD_CARD"
  | "SELECT_OPPONENT_GRAVEYARD_CARD"
  | "SELECT_OPPONENT_SET_CARD";

interface IBasePendingTurnAction {
  playerId: string;
}

export interface IDiscardForHandLimitPendingTurnAction extends IBasePendingTurnAction {
  type: "DISCARD_FOR_HAND_LIMIT";
}

export interface ISelectFusionMaterialsPendingTurnAction extends IBasePendingTurnAction {
  type: "SELECT_FUSION_MATERIALS";
  fusionCardId?: string;
  fusionFromExecutionInstanceId?: string;
  fusionFromExecutionRecipeId?: string;
  mode: "ATTACK" | "DEFENSE";
  selectedMaterialInstanceIds: string[];
}

export interface ISelectGraveyardCardPendingTurnAction extends IBasePendingTurnAction {
  type: "SELECT_GRAVEYARD_CARD";
  executionInstanceId: string;
  destination: "HAND" | "FIELD";
  cardType?: "ENTITY" | "EXECUTION" | "TRAP" | "FUSION" | "ENVIRONMENT";
}

export interface ISelectOpponentGraveyardCardPendingTurnAction extends IBasePendingTurnAction {
  type: "SELECT_OPPONENT_GRAVEYARD_CARD";
  executionInstanceId: string;
  cardType?: "ENTITY" | "EXECUTION" | "TRAP" | "FUSION" | "ENVIRONMENT";
}

export interface ISelectOpponentSetCardPendingTurnAction extends IBasePendingTurnAction {
  type: "SELECT_OPPONENT_SET_CARD";
  executionInstanceId: string;
  zone: "ENTITIES" | "EXECUTIONS" | "ANY";
}

export type IPendingTurnAction =
  | IDiscardForHandLimitPendingTurnAction
  | ISelectFusionMaterialsPendingTurnAction
  | ISelectGraveyardCardPendingTurnAction
  | ISelectOpponentGraveyardCardPendingTurnAction
  | ISelectOpponentSetCardPendingTurnAction;

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
  idFactory?: IGameEngineIdFactory;
}
