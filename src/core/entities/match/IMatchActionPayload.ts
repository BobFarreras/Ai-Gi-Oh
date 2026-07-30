// src/core/entities/match/IMatchActionPayload.ts - Define las acciones deterministas compartidas por transporte, journal y replay.
import { BattleMode } from "@/core/entities/IPlayer";

export const MATCH_ACTION_TYPES = [
  "PLAY_CARD", "PLAY_CARD_REPLACE_ENTITY", "PLAY_CARD_REPLACE_ZONE", "FUSE_CARDS",
  "START_FUSION_SUMMON", "ATTACK", "NEXT_PHASE", "RESOLVE_EXECUTION",
  "CHANGE_ENTITY_MODE", "RESOLVE_PENDING_TURN_ACTION", "RESOLVE_REACTIVE_TRAP",
] as const;

export type MatchActionType = (typeof MATCH_ACTION_TYPES)[number];

export interface IPlayCardPayload {
  cardId: string;
  mode: BattleMode;
}

export interface IPlayCardReplaceEntityPayload extends IPlayCardPayload {
  sacrificedEntityInstanceId: string;
}

export interface IPlayCardReplaceZonePayload extends IPlayCardReplaceEntityPayload {
  zone: "ENTITIES" | "EXECUTIONS";
}

export interface IFuseCardsPayload {
  cardId: string;
  material1InstanceId: string;
  material2InstanceId: string;
  mode: "ATTACK" | "DEFENSE";
}

export interface IStartFusionSummonPayload {
  cardId: string;
  mode: "ATTACK" | "DEFENSE";
}

export interface IAttackPayload {
  attackerInstanceId: string;
  defenderInstanceId?: string;
  declineCounterTrap?: boolean;
  deferReactiveTraps?: boolean;
  declineReactiveTrap?: boolean;
  chosenTrapInstanceId?: string;
}

export interface IResolveReactiveTrapPayload {
  activate: boolean;
  chosenTrapInstanceId?: string;
}

export interface IResolveExecutionPayload {
  instanceId: string;
  declineCounterTrap?: boolean;
  declineReactiveTrap?: boolean;
  chosenTrapInstanceId?: string;
}

export interface IChangeEntityModePayload {
  instanceId: string;
  newMode: "ATTACK" | "DEFENSE" | "ACTIVATE";
}

export interface IResolvePendingTurnActionPayload {
  selectedId: string;
}

export type IMatchActionPayload =
  | { type: "PLAY_CARD"; payload: IPlayCardPayload }
  | { type: "PLAY_CARD_REPLACE_ENTITY"; payload: IPlayCardReplaceEntityPayload }
  | { type: "PLAY_CARD_REPLACE_ZONE"; payload: IPlayCardReplaceZonePayload }
  | { type: "FUSE_CARDS"; payload: IFuseCardsPayload }
  | { type: "START_FUSION_SUMMON"; payload: IStartFusionSummonPayload }
  | { type: "ATTACK"; payload: IAttackPayload }
  | { type: "NEXT_PHASE"; payload: Record<string, never> }
  | { type: "RESOLVE_EXECUTION"; payload: IResolveExecutionPayload }
  | { type: "CHANGE_ENTITY_MODE"; payload: IChangeEntityModePayload }
  | { type: "RESOLVE_PENDING_TURN_ACTION"; payload: IResolvePendingTurnActionPayload }
  | { type: "RESOLVE_REACTIVE_TRAP"; payload: IResolveReactiveTrapPayload };
