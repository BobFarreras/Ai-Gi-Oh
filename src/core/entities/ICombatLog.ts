// src/core/entities/ICombatLog.ts - Contratos tipados para eventos del combatLog en motor y UI.
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
  | "CARD_TO_DESTROYED"
  | "MANDATORY_ACTION_RESOLVED"
  | "FUSION_SUMMONED"
  | "CARD_XP_GAINED"
  | "CARD_LEVEL_UP"
  | "AUTO_PHASE_ADVANCED"
  | "TURN_GUARD_SHOWN"
  | "TURN_GUARD_CONFIRMED"
  | "TURN_GUARD_CANCELLED";

export interface ICombatLogEvent {
  id: string;
  turn: number;
  phase: TurnPhase;
  actorPlayerId: string;
  eventType: CombatLogEventType;
  payload: Record<string, unknown>;
  timestamp: string;
}
