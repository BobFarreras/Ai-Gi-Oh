// src/core/entities/multiplayer/IMatchAction.ts - Tipos de acciones de partida transmitidas entre jugadores y validadas por el servidor.
import { BattleMode } from "@/core/entities/IPlayer";

export const MATCH_ACTION_TYPES = [
  "PLAY_CARD",
  "PLAY_CARD_REPLACE_ENTITY",
  "PLAY_CARD_REPLACE_ZONE",
  "FUSE_CARDS",
  "ATTACK",
  "NEXT_PHASE",
  "RESOLVE_EXECUTION",
  "CHANGE_ENTITY_MODE",
  "RESOLVE_PENDING_TURN_ACTION",
] as const;

export type MatchActionType =
  | "PLAY_CARD"
  | "PLAY_CARD_REPLACE_ENTITY"
  | "PLAY_CARD_REPLACE_ZONE"
  | "FUSE_CARDS"
  | "ATTACK"
  | "NEXT_PHASE"
  | "RESOLVE_EXECUTION"
  | "CHANGE_ENTITY_MODE"
  | "RESOLVE_PENDING_TURN_ACTION";

export interface IPlayCardPayload {
  cardId: string;
  mode: BattleMode;
}

export interface IPlayCardReplaceEntityPayload {
  cardId: string;
  mode: BattleMode;
  sacrificedEntityInstanceId: string;
}

export interface IPlayCardReplaceZonePayload {
  cardId: string;
  mode: BattleMode;
  sacrificedEntityInstanceId: string;
  zone: "ENTITIES" | "EXECUTIONS";
}

export interface IFuseCardsPayload {
  cardId: string;
  material1InstanceId: string;
  material2InstanceId: string;
  mode: "ATTACK" | "DEFENSE";
}

export interface IAttackPayload {
  attackerInstanceId: string;
  defenderInstanceId?: string;
}

export interface IResolveExecutionPayload {
  instanceId: string;
}

export interface IChangeEntityModePayload {
  instanceId: string;
  newMode: "ATTACK" | "DEFENSE";
}

export interface IResolvePendingTurnActionPayload {
  selectedId: string;
}

export type IMatchActionPayload =
  | { type: "PLAY_CARD"; payload: IPlayCardPayload }
  | { type: "PLAY_CARD_REPLACE_ENTITY"; payload: IPlayCardReplaceEntityPayload }
  | { type: "PLAY_CARD_REPLACE_ZONE"; payload: IPlayCardReplaceZonePayload }
  | { type: "FUSE_CARDS"; payload: IFuseCardsPayload }
  | { type: "ATTACK"; payload: IAttackPayload }
  | { type: "NEXT_PHASE"; payload: Record<string, never> }
  | { type: "RESOLVE_EXECUTION"; payload: IResolveExecutionPayload }
  | { type: "CHANGE_ENTITY_MODE"; payload: IChangeEntityModePayload }
  | { type: "RESOLVE_PENDING_TURN_ACTION"; payload: IResolvePendingTurnActionPayload };
