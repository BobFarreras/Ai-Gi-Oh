// src/components/game/board/ui/overlays/internal/effect-targeted-overlay-logic.ts - Selección de señales de buff/debuff y bloqueo de trampa desde combatLog.
import { ICombatLogEvent } from "@/core/entities/ICombatLog";

export interface ITargetedStatSignal {
  id: string;
  sourceCardId: string | null;
  actorIsPlayerA: boolean;
  amount: number;
  targetEntityIds: string[];
}

export interface ITrapBlockSignal {
  id: string;
  trapCardId: string;
  trapSlotIndex: number;
  action: string;
  actorIsPlayerA: boolean;
  targetIsPlayerA: boolean;
  blockedTargetEntityInstanceId: string | null;
  destroyedTargetEntityInstanceId: string | null;
  destroyedTargetEntitySlotIndex: number | null;
}

function asPayload(event: ICombatLogEvent): Record<string, unknown> | null {
  return typeof event.payload === "object" && event.payload !== null ? (event.payload as Record<string, unknown>) : null;
}

function readStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function resolveSourceCardId(events: ICombatLogEvent[], fromIndex: number, actorPlayerId: string): string | null {
  for (let index = fromIndex - 1; index >= 0 && fromIndex - index <= 5; index -= 1) {
    const event = events[index];
    if (event.actorPlayerId !== actorPlayerId) continue;
    if (event.eventType === "TRAP_TRIGGERED") {
      const payload = asPayload(event);
      return payload && typeof payload.trapCardId === "string" ? payload.trapCardId : null;
    }
    if (event.eventType === "CARD_TO_GRAVEYARD") {
      const payload = asPayload(event);
      if (payload && payload.from === "EXECUTION_ZONE" && typeof payload.cardId === "string") return payload.cardId;
    }
  }
  return null;
}

export function resolveLatestStatSignal(events: ICombatLogEvent[], playerAId: string): ITargetedStatSignal | null {
  for (let index = events.length - 1; index >= 0; index -= 1) {
    const event = events[index];
    if (event.eventType !== "STAT_BUFF_APPLIED") continue;
    const payload = asPayload(event);
    if (!payload) continue;
    const amount = typeof payload.amount === "number" ? payload.amount : 0;
    const targetEntityIds = readStringArray(payload.targetEntityIds);
    if (amount === 0 || targetEntityIds.length === 0) continue;
    return {
      id: event.id,
      sourceCardId: resolveSourceCardId(events, index, event.actorPlayerId),
      actorIsPlayerA: event.actorPlayerId === playerAId,
      amount,
      targetEntityIds,
    };
  }
  return null;
}

export function resolveLatestTrapBlockSignal(events: ICombatLogEvent[], playerAId: string): ITrapBlockSignal | null {
  for (let index = events.length - 1; index >= 0; index -= 1) {
    const event = events[index];
    if (event.eventType !== "TRAP_TRIGGERED") continue;
    const payload = asPayload(event);
    if (!payload || typeof payload.trapCardId !== "string" || typeof payload.effectAction !== "string") continue;
    const action = payload.effectAction;
    const isBlock = action === "NEGATE_ATTACK_AND_DESTROY_ATTACKER" || action === "NEGATE_OPPONENT_TRAP_AND_DESTROY" || action === "FORCE_SUMMONED_DEFENSE_TO_ATTACK_LOCKED";
    if (!isBlock) continue;
    return {
      id: event.id,
      trapCardId: payload.trapCardId,
      trapSlotIndex: typeof payload.trapSlotIndex === "number" ? payload.trapSlotIndex : 0,
      action,
      actorIsPlayerA: event.actorPlayerId === playerAId,
      targetIsPlayerA: event.actorPlayerId !== playerAId,
      blockedTargetEntityInstanceId: typeof payload.blockedTargetEntityInstanceId === "string" ? payload.blockedTargetEntityInstanceId : null,
      destroyedTargetEntityInstanceId: typeof payload.destroyedOpponentEntityInstanceId === "string" ? payload.destroyedOpponentEntityInstanceId : null,
      destroyedTargetEntitySlotIndex: typeof payload.destroyedOpponentEntitySlotIndex === "number" ? payload.destroyedOpponentEntitySlotIndex : null,
    };
  }
  return null;
}
