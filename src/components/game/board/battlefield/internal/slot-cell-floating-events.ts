// src/components/game/board/battlefield/internal/slot-cell-floating-events.ts - Construye la cola de eventos flotantes del slot.
import { IBoardEntity } from "@/core/entities/IPlayer";
import { FloatingEvent } from "@/components/game/board/battlefield/internal/slot-cell-types";

export function buildFloatingEvents(
  entity: IBoardEntity | null,
  buffEventId: string | null,
  buffStat: "ATTACK" | "DEFENSE" | null,
  buffAmount: number | null,
  isBuffed: boolean,
  cardXpEventId: string | null,
  cardXpCardId: string | null,
  cardXpAmount: number | null,
): FloatingEvent[] {
  if (!entity) return [];
  const events: FloatingEvent[] = [];
  if (buffEventId && buffStat && (buffAmount ?? 0) !== 0 && isBuffed) {
    events.push({ id: `${buffEventId}-${entity.instanceId}`, type: "STAT", amount: buffAmount ?? 0, stat: buffStat });
  }
  if (cardXpEventId && (cardXpAmount ?? 0) > 0 && cardXpCardId === entity.card.id) {
    events.push({ id: `${cardXpEventId}-${entity.instanceId}`, type: "XP", amount: cardXpAmount ?? 0 });
  }
  return events;
}
