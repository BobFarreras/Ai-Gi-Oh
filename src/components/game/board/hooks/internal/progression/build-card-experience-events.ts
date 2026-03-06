// src/components/game/board/hooks/internal/progression/build-card-experience-events.ts - Convierte combatLog en eventos de EXP de carta para persistencia batch post-duelo.
import { ICombatLogEvent } from "@/core/entities/ICombatLog";
import { CardExperienceEventType, ICardExperienceEvent } from "@/core/services/progression/card-experience-rules";

function readPayloadString(payload: Record<string, unknown>, key: string): string | null {
  const value = payload[key];
  return typeof value === "string" && value.trim() ? value : null;
}

function readPayloadNumber(payload: Record<string, unknown>, key: string): number | null {
  const value = payload[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function readPayloadBoolean(payload: Record<string, unknown>, key: string): boolean | null {
  const value = payload[key];
  return typeof value === "boolean" ? value : null;
}

function pushEvent(
  events: ICardExperienceEvent[],
  cardId: string | null,
  eventType: CardExperienceEventType,
): void {
  if (!cardId) return;
  events.push({ cardId, eventType });
}

export function buildCardExperienceEvents(combatLog: ICombatLogEvent[], playerId: string): ICardExperienceEvent[] {
  const events: ICardExperienceEvent[] = [];

  for (const logEvent of combatLog) {
    if (logEvent.actorPlayerId !== playerId) continue;
    const payload = logEvent.payload;

    if (logEvent.eventType === "CARD_PLAYED") {
      const cardId = readPayloadString(payload, "cardId");
      const cardType = readPayloadString(payload, "cardType");
      const mode = readPayloadString(payload, "mode");
      if (cardType === "ENTITY") pushEvent(events, cardId, "SUMMON_SUCCESS");
      if (cardType === "EXECUTION" && mode === "ACTIVATE") pushEvent(events, cardId, "ACTIVATE_EFFECT");
      continue;
    }

    if (logEvent.eventType === "FUSION_SUMMONED") {
      pushEvent(events, readPayloadString(payload, "fusionCardId"), "SUMMON_SUCCESS");
      continue;
    }

    if (logEvent.eventType === "TRAP_TRIGGERED") {
      pushEvent(events, readPayloadString(payload, "trapCardId"), "ACTIVATE_EFFECT");
      continue;
    }

    if (logEvent.eventType === "BATTLE_RESOLVED") {
      const attackerCardId = readPayloadString(payload, "attackerCardId");
      const defenderCardId = readPayloadString(payload, "defenderCardId");
      const defenderDestroyed = readPayloadBoolean(payload, "defenderDestroyed");
      const damageToDefenderPlayer = readPayloadNumber(payload, "damageToDefenderPlayer") ?? 0;
      if (defenderDestroyed) pushEvent(events, attackerCardId, "DESTROY_ENEMY_ENTITY");
      if (!defenderCardId && damageToDefenderPlayer > 0) pushEvent(events, attackerCardId, "DIRECT_HIT");
    }
  }

  return events;
}

