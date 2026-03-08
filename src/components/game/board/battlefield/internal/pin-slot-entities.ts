// src/components/game/board/battlefield/internal/pin-slot-entities.ts - Mantiene entidades fijadas a su slot visual para evitar desplazamientos al eliminar cartas.
import { IBoardEntity } from "@/core/entities/IPlayer";

export interface IPinSlotsResult {
  slotByEntityId: Record<string, number>;
  entitiesBySlot: Array<IBoardEntity | null>;
}

export function pinSlotEntities(
  entities: IBoardEntity[],
  totalSlots: number,
  previousSlotByEntityId: Record<string, number>,
): IPinSlotsResult {
  const nextSlotByEntityId: Record<string, number> = {};
  const occupied = new Set<number>();
  const validIds = new Set(entities.map((entity) => entity.instanceId));

  Object.entries(previousSlotByEntityId).forEach(([entityId, slotIndex]) => {
    if (!validIds.has(entityId)) return;
    if (slotIndex < 0 || slotIndex >= totalSlots) return;
    if (occupied.has(slotIndex)) return;
    nextSlotByEntityId[entityId] = slotIndex;
    occupied.add(slotIndex);
  });

  entities.forEach((entity) => {
    if (entity.instanceId in nextSlotByEntityId) return;
    for (let slotIndex = 0; slotIndex < totalSlots; slotIndex += 1) {
      if (occupied.has(slotIndex)) continue;
      nextSlotByEntityId[entity.instanceId] = slotIndex;
      occupied.add(slotIndex);
      break;
    }
  });

  const entitiesBySlot: Array<IBoardEntity | null> = Array.from({ length: totalSlots }, () => null);
  entities.forEach((entity) => {
    const slotIndex = nextSlotByEntityId[entity.instanceId];
    if (slotIndex === undefined) return;
    entitiesBySlot[slotIndex] = entity;
  });

  return { slotByEntityId: nextSlotByEntityId, entitiesBySlot };
}
