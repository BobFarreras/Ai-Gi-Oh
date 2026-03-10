// src/components/game/board/internal/combat-log-presentation/payload-readers.ts - Lectores seguros de payload para eventos del combat log.
import { ICombatLogEvent } from "@/core/entities/ICombatLog";

/**
 * Lee un campo string desde payload sin exponer castings inseguros en formateadores.
 */
export function readPayloadField(payload: unknown, key: string): string | null {
  if (typeof payload !== "object" || payload === null || !(key in payload)) return null;
  const value = (payload as Record<string, unknown>)[key];
  return typeof value === "string" ? value : null;
}

export function readPayloadBoolean(payload: unknown, key: string): boolean | null {
  if (typeof payload !== "object" || payload === null || !(key in payload)) return null;
  const value = (payload as Record<string, unknown>)[key];
  return typeof value === "boolean" ? value : null;
}

export function readPayloadNumber(payload: unknown, key: string): number | null {
  if (typeof payload !== "object" || payload === null || !(key in payload)) return null;
  const value = (payload as Record<string, unknown>)[key];
  return typeof value === "number" ? value : null;
}

export function extractEventCardIds(event: ICombatLogEvent): string[] {
  const cardId = readPayloadField(event.payload, "cardId");
  const attackerCard = readPayloadField(event.payload, "attackerCardId");
  const defenderCard = readPayloadField(event.payload, "defenderCardId");
  return [cardId, attackerCard, defenderCard].filter((value): value is string => Boolean(value));
}

export function extractEventAmount(event: ICombatLogEvent): number | null {
  return readPayloadNumber(event.payload, "amount");
}
