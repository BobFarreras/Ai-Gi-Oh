import { ICombatLogEvent } from "@/core/entities/ICombatLog";

interface IEventPayload {
  targetPlayerId?: unknown;
  amount?: unknown;
  targetEntityIds?: unknown;
  stat?: unknown;
}

export interface IBoardCombatFeedback {
  lastDamageTargetPlayerId: string | null;
  lastDamageAmount: number | null;
  lastDamageEventId: string | null;
  lastHealTargetPlayerId: string | null;
  lastHealAmount: number | null;
  lastHealEventId: string | null;
  lastBuffTargetEntityIds: string[];
  lastBuffStat: string | null;
  lastBuffAmount: number | null;
  lastBuffEventId: string | null;
}

function findLatestEvent(events: ICombatLogEvent[], eventType: ICombatLogEvent["eventType"]): ICombatLogEvent | null {
  return [...events].reverse().find((event) => event.eventType === eventType) ?? null;
}

function asPayload(event: ICombatLogEvent | null): IEventPayload {
  if (!event || typeof event.payload !== "object" || event.payload === null) {
    return {};
  }
  return event.payload as IEventPayload;
}

function parseTargetEntityIds(payload: IEventPayload): string[] {
  if (!Array.isArray(payload.targetEntityIds)) {
    return [];
  }
  return payload.targetEntityIds
    .map((value) => (typeof value === "string" ? value : null))
    .filter((value): value is string => value !== null);
}

export function buildBoardCombatFeedback(events: ICombatLogEvent[]): IBoardCombatFeedback {
  const damageEvent = findLatestEvent(events, "DIRECT_DAMAGE");
  const healEvent = findLatestEvent(events, "HEAL_APPLIED");
  const buffEvent = findLatestEvent(events, "STAT_BUFF_APPLIED");
  const damagePayload = asPayload(damageEvent);
  const healPayload = asPayload(healEvent);
  const buffPayload = asPayload(buffEvent);

  return {
    lastDamageTargetPlayerId: typeof damagePayload.targetPlayerId === "string" ? damagePayload.targetPlayerId : null,
    lastDamageAmount: typeof damagePayload.amount === "number" ? damagePayload.amount : null,
    lastDamageEventId: damageEvent?.id ?? null,
    lastHealTargetPlayerId: typeof healPayload.targetPlayerId === "string" ? healPayload.targetPlayerId : null,
    lastHealAmount: typeof healPayload.amount === "number" ? healPayload.amount : null,
    lastHealEventId: healEvent?.id ?? null,
    lastBuffTargetEntityIds: parseTargetEntityIds(buffPayload),
    lastBuffStat: typeof buffPayload.stat === "string" ? buffPayload.stat : null,
    lastBuffAmount: typeof buffPayload.amount === "number" ? buffPayload.amount : null,
    lastBuffEventId: buffEvent?.id ?? null,
  };
}
