// src/components/game/board/hooks/internal/trapPreview.ts - Adapta trampas reactivas a la coreografía de revelado del tablero.
import { ICard } from "@/core/entities/ICard";
import { IBoardEntity } from "@/core/entities/IPlayer";

/** Adapta entities de trampa al formato del carrusel de decisión (carta + instanceId). */
export function toTrapEligibleOptions(traps: IBoardEntity[]): { card: ICard; instanceId: string }[] {
  return traps.map((entity) => ({ card: entity.card, instanceId: entity.instanceId }));
}

export function addRevealedId(ids: string[], entityId: string): string[] {
  if (ids.includes(entityId)) {
    return ids;
  }
  return [...ids, entityId];
}

export function removeRevealedId(ids: string[], entityId: string): string[] {
  return ids.filter((id) => id !== entityId);
}
