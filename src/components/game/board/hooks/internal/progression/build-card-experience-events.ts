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
  ownedCardIds: ReadonlySet<string>,
): void {
  if (!cardId) return;
  // La lista cerrada evita acreditar cartas ajenas incluso cuando el jugador no tiene un mazo válido.
  if (!ownedCardIds.has(cardId)) return;
  events.push({ cardId, eventType });
}

/**
 * Construye eventos de EXP a partir del combatLog.
 * @param combatLog - Registro de eventos de combate.
 * @param playerId - ID del jugador activo.
 * @param ownedCardIds - Instantánea de cardIds propios al comienzo del duelo.
 */
export function buildCardExperienceEvents(
  combatLog: ICombatLogEvent[],
  playerId: string,
  ownedCardIds: ReadonlySet<string>,
): ICardExperienceEvent[] {
  const events: ICardExperienceEvent[] = [];

  for (const logEvent of combatLog) {
    if (logEvent.actorPlayerId !== playerId) continue;
    const payload = logEvent.payload;

    if (logEvent.eventType === "CARD_PLAYED") {
      const cardId = readPayloadString(payload, "cardId");
      const cardType = readPayloadString(payload, "cardType");
      const mode = readPayloadString(payload, "mode");
      if (cardType === "ENTITY") pushEvent(events, cardId, "SUMMON_SUCCESS", ownedCardIds);
      if (cardType === "EXECUTION" && mode === "ACTIVATE") pushEvent(events, cardId, "ACTIVATE_EFFECT", ownedCardIds);
      continue;
    }

    if (logEvent.eventType === "FUSION_SUMMONED") {
      pushEvent(events, readPayloadString(payload, "fusionCardId"), "SUMMON_SUCCESS", ownedCardIds);
      continue;
    }

    if (logEvent.eventType === "TRAP_TRIGGERED") {
      pushEvent(events, readPayloadString(payload, "trapCardId"), "ACTIVATE_EFFECT", ownedCardIds);
      continue;
    }

    if (logEvent.eventType === "BATTLE_RESOLVED") {
      const attackerCardId = readPayloadString(payload, "attackerCardId");
      const defenderCardId = readPayloadString(payload, "defenderCardId");
      const defenderDestroyed = readPayloadBoolean(payload, "defenderDestroyed");
      const damageToDefenderPlayer = readPayloadNumber(payload, "damageToDefenderPlayer") ?? 0;
      if (defenderDestroyed) pushEvent(events, attackerCardId, "DESTROY_ENEMY_ENTITY", ownedCardIds);
      if (!defenderCardId && damageToDefenderPlayer > 0) pushEvent(events, attackerCardId, "DIRECT_HIT", ownedCardIds);
    }
  }

  return events;
}

