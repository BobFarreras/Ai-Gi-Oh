// src/core/entities/multiplayer/IMatchAction.ts - Tipos de acciones de partida transmitidas entre jugadores y validadas por el servidor.
import { BattleMode } from "@/core/entities/IPlayer";

export const MATCH_ACTION_TYPES = [
  "PLAY_CARD",
  "PLAY_CARD_REPLACE_ENTITY",
  "PLAY_CARD_REPLACE_ZONE",
  "FUSE_CARDS",
  "START_FUSION_SUMMON",
  "ATTACK",
  "NEXT_PHASE",
  "RESOLVE_EXECUTION",
  "CHANGE_ENTITY_MODE",
  "RESOLVE_PENDING_TURN_ACTION",
  "RESOLVE_REACTIVE_TRAP",
] as const;

export type MatchActionType =
  | "PLAY_CARD"
  | "PLAY_CARD_REPLACE_ENTITY"
  | "PLAY_CARD_REPLACE_ZONE"
  | "FUSE_CARDS"
  | "START_FUSION_SUMMON"
  | "ATTACK"
  | "NEXT_PHASE"
  | "RESOLVE_EXECUTION"
  | "CHANGE_ENTITY_MODE"
  | "RESOLVE_PENDING_TURN_ACTION"
  | "RESOLVE_REACTIVE_TRAP";

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

export interface IStartFusionSummonPayload {
  cardId: string;
  mode: "ATTACK" | "DEFENSE";
}

export interface IAttackPayload {
  attackerInstanceId: string;
  defenderInstanceId?: string;
  /** El atacante decidió NO activar su contra-trampa (Nullify). Viaja con la acción para que el
   * replay del rival sea determinista y no auto-active lo que el jugador rechazó. */
  declineCounterTrap?: boolean;
  /** Ficha 4 (multi): si el defensor tiene trampas reactivas elegibles, PAUSA el ataque en ambos clientes
   * (para que el defensor elija en el suyo). La resolución llega luego como `RESOLVE_REACTIVE_TRAP`. */
  deferReactiveTraps?: boolean;
}

export interface IResolveReactiveTrapPayload {
  /** El defensor activa una trampa (`true`) o pasa sin activar ninguna (`false`). */
  activate: boolean;
  /** Trampa elegida al activar; se revalida en el motor (id que no casa ⇒ no activa nada). */
  chosenTrapInstanceId?: string;
}

export interface IResolveExecutionPayload {
  instanceId: string;
  /** El jugador decidió NO activar su contra-trampa (Nullify) al resolver la ejecución. */
  declineCounterTrap?: boolean;
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
  | { type: "START_FUSION_SUMMON"; payload: IStartFusionSummonPayload }
  | { type: "ATTACK"; payload: IAttackPayload }
  | { type: "NEXT_PHASE"; payload: Record<string, never> }
  | { type: "RESOLVE_EXECUTION"; payload: IResolveExecutionPayload }
  | { type: "CHANGE_ENTITY_MODE"; payload: IChangeEntityModePayload }
  | { type: "RESOLVE_PENDING_TURN_ACTION"; payload: IResolvePendingTurnActionPayload }
  | { type: "RESOLVE_REACTIVE_TRAP"; payload: IResolveReactiveTrapPayload };
