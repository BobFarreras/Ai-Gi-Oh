import { TurnPhase } from "@/core/use-cases/game-engine/state/types";

export type CombatLogEventType =
  | "TURN_STARTED"
  | "PHASE_CHANGED"
  | "ENERGY_GAINED"
  | "CARD_PLAYED"
  | "ATTACK_DECLARED"
  | "BATTLE_RESOLVED"
  | "DIRECT_DAMAGE"
  | "HEAL_APPLIED"
  | "STAT_BUFF_APPLIED"
  | "TRAP_TRIGGERED"
  | "CARD_TO_GRAVEYARD"
  | "MANDATORY_ACTION_RESOLVED"
  | "FUSION_SUMMONED";

export interface ICombatLogEvent {
  id: string;
  turn: number;
  phase: TurnPhase;
  actorPlayerId: string;
  eventType: CombatLogEventType;
  payload: Record<string, unknown>;
  timestamp: string;
}
