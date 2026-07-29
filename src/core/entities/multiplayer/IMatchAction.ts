// src/core/entities/multiplayer/IMatchAction.ts - Mantiene compatibilidad del transporte multiplayer con las acciones canónicas de Match.
export {
  MATCH_ACTION_TYPES,
  type MatchActionType,
  type IPlayCardPayload,
  type IPlayCardReplaceEntityPayload,
  type IPlayCardReplaceZonePayload,
  type IFuseCardsPayload,
  type IStartFusionSummonPayload,
  type IAttackPayload,
  type IResolveReactiveTrapPayload,
  type IResolveExecutionPayload,
  type IChangeEntityModePayload,
  type IResolvePendingTurnActionPayload,
  type IMatchActionPayload,
} from "@/core/entities/match/IMatchActionPayload";
