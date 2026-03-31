// src/components/game/board/hooks/internal/board-state/boardCombatFeedback.ts - Extrae del combatLog los últimos eventos de feedback visual para HUD y tablero.
import { ICombatLogEvent } from "@/core/entities/ICombatLog";

interface IEventPayload {
  targetPlayerId?: unknown;
  amount?: unknown;
  targetEntityIds?: unknown;
  stat?: unknown;
  cardId?: unknown;
  cardType?: unknown;
  mode?: unknown;
  trapCardId?: unknown;
  fusionCardId?: unknown;
  attackerCardId?: unknown;
  defenderCardId?: unknown;
  defenderDestroyed?: unknown;
  damageToDefenderPlayer?: unknown;
}

export interface IBoardCombatFeedback {
  lastDamageTargetPlayerId: string | null;
  lastDamageAmount: number | null;
  lastDamageEventId: string | null;
  lastHealTargetPlayerId: string | null;
  lastHealAmount: number | null;
  lastHealEventId: string | null;
  lastEnergyTargetPlayerId: string | null;
  lastEnergyAmount: number | null;
  lastEnergyEventId: string | null;
  lastBuffTargetEntityIds: string[];
  lastBuffStat: string | null;
  lastBuffAmount: number | null;
  lastBuffEventId: string | null;
  lastCardXpCardId: string | null;
  lastCardXpAmount: number | null;
  lastCardXpEventId: string | null;
  lastCardXpActorPlayerId: string | null;
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

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function resolveLatestCardXpFeedback(events: ICombatLogEvent[]): {
  cardId: string | null;
  amount: number | null;
  eventId: string | null;
  actorPlayerId: string | null;
} {
  for (let index = events.length - 1; index >= 0; index -= 1) {
    const event = events[index];
    const payload = asPayload(event);
    if (event.eventType === "CARD_XP_GAINED") {
      const cardId = asString(payload.cardId);
      const amount = typeof payload.amount === "number" ? payload.amount : null;
      if (cardId && amount && amount > 0) return { cardId, amount, eventId: event.id, actorPlayerId: event.actorPlayerId };
    }
    if (event.eventType === "CARD_PLAYED") {
      const cardId = asString(payload.cardId);
      const cardType = asString(payload.cardType);
      const mode = asString(payload.mode);
      const amount = cardType === "ENTITY" ? 10 : cardType === "EXECUTION" && mode === "ACTIVATE" ? 20 : null;
      if (cardId && amount) return { cardId, amount, eventId: event.id, actorPlayerId: event.actorPlayerId };
    }
    if (event.eventType === "TRAP_TRIGGERED") {
      const cardId = asString(payload.trapCardId);
      if (cardId) return { cardId, amount: 20, eventId: event.id, actorPlayerId: event.actorPlayerId };
    }
    if (event.eventType === "FUSION_SUMMONED") {
      const cardId = asString(payload.fusionCardId);
      if (cardId) return { cardId, amount: 10, eventId: event.id, actorPlayerId: event.actorPlayerId };
    }
    if (event.eventType === "BATTLE_RESOLVED") {
      const attackerCardId = asString(payload.attackerCardId);
      const defenderCardId = asString(payload.defenderCardId);
      const defenderDestroyed = payload.defenderDestroyed === true;
      const damageToDefenderPlayer = typeof payload.damageToDefenderPlayer === "number" ? payload.damageToDefenderPlayer : 0;
      if (!attackerCardId) continue;
      const amount = !defenderCardId && damageToDefenderPlayer > 0 ? 30 : defenderDestroyed ? 25 : null;
      if (amount) return { cardId: attackerCardId, amount, eventId: event.id, actorPlayerId: event.actorPlayerId };
    }
  }
  return { cardId: null, amount: null, eventId: null, actorPlayerId: null };
}

export function buildBoardCombatFeedback(events: ICombatLogEvent[]): IBoardCombatFeedback {
  const damageEvent = findLatestEvent(events, "DIRECT_DAMAGE");
  const healEvent = findLatestEvent(events, "HEAL_APPLIED");
  const energyEvent = findLatestEvent(events, "ENERGY_GAINED");
  const buffEvent = findLatestEvent(events, "STAT_BUFF_APPLIED");
  const damagePayload = asPayload(damageEvent);
  const healPayload = asPayload(healEvent);
  const energyPayload = asPayload(energyEvent);
  const buffPayload = asPayload(buffEvent);
  const latestCardXpFeedback = resolveLatestCardXpFeedback(events);

  return {
    lastDamageTargetPlayerId: typeof damagePayload.targetPlayerId === "string" ? damagePayload.targetPlayerId : null,
    lastDamageAmount: typeof damagePayload.amount === "number" ? damagePayload.amount : null,
    lastDamageEventId: damageEvent?.id ?? null,
    lastHealTargetPlayerId: typeof healPayload.targetPlayerId === "string" ? healPayload.targetPlayerId : null,
    lastHealAmount: typeof healPayload.amount === "number" ? healPayload.amount : null,
    lastHealEventId: healEvent?.id ?? null,
    lastEnergyTargetPlayerId: energyEvent?.actorPlayerId ?? null,
    lastEnergyAmount: typeof energyPayload.amount === "number" ? energyPayload.amount : null,
    lastEnergyEventId: energyEvent?.id ?? null,
    lastBuffTargetEntityIds: parseTargetEntityIds(buffPayload),
    lastBuffStat: typeof buffPayload.stat === "string" ? buffPayload.stat : null,
    lastBuffAmount: typeof buffPayload.amount === "number" ? buffPayload.amount : null,
    lastBuffEventId: buffEvent?.id ?? null,
    lastCardXpCardId: latestCardXpFeedback.cardId,
    lastCardXpAmount: latestCardXpFeedback.amount,
    lastCardXpEventId: latestCardXpFeedback.eventId,
    lastCardXpActorPlayerId: latestCardXpFeedback.actorPlayerId,
  };
}
