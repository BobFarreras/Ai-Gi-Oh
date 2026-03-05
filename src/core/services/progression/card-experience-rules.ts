// src/core/services/progression/card-experience-rules.ts - Reglas puras de EXP por evento de combate para cartas.
import { ValidationError } from "@/core/errors/ValidationError";

export type CardExperienceEventType =
  | "SUMMON_SUCCESS"
  | "DESTROY_ENEMY_ENTITY"
  | "ACTIVATE_EFFECT"
  | "DIRECT_HIT";

const CARD_EXPERIENCE_BY_EVENT: Record<CardExperienceEventType, number> = {
  SUMMON_SUCCESS: 10,
  DESTROY_ENEMY_ENTITY: 25,
  ACTIVATE_EFFECT: 20,
  DIRECT_HIT: 30,
};

export interface ICardExperienceEvent {
  cardId: string;
  eventType: CardExperienceEventType;
}

export interface ICardExperienceEntry {
  cardId: string;
  gainedXp: number;
}

export function getCardExperienceForEvent(eventType: CardExperienceEventType): number {
  return CARD_EXPERIENCE_BY_EVENT[eventType];
}

export function aggregateCardExperienceEvents(events: ICardExperienceEvent[]): ICardExperienceEntry[] {
  const xpByCard = new Map<string, number>();
  for (const event of events) {
    if (!event.cardId.trim()) throw new ValidationError("El cardId del evento de experiencia es obligatorio.");
    const gainedXp = getCardExperienceForEvent(event.eventType);
    xpByCard.set(event.cardId, (xpByCard.get(event.cardId) ?? 0) + gainedXp);
  }
  return Array.from(xpByCard.entries()).map(([cardId, gainedXp]) => ({ cardId, gainedXp }));
}

