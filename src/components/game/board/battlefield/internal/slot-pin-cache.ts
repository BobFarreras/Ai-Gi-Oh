// src/components/game/board/battlefield/internal/slot-pin-cache.ts - Mantiene caché de slots por lado para fijar posiciones visuales entre renders.
import { IBoardEntity } from "@/core/entities/IPlayer";
import { IPinSlotsResult, pinSlotEntities } from "./pin-slot-entities";

type SideKey = "player" | "opponent";
type LaneKey = "entities" | "executions";
type CacheKey = `${SideKey}:${LaneKey}`;

const slotMapCacheBySide: Record<CacheKey, Record<string, number>> = {
  "player:entities": {},
  "player:executions": {},
  "opponent:entities": {},
  "opponent:executions": {},
};

export function resolvePinnedSlotsForSide(
  side: SideKey,
  lane: LaneKey,
  entities: IBoardEntity[],
  totalSlots: number,
): IPinSlotsResult {
  const cacheKey: CacheKey = `${side}:${lane}`;
  const previousSlots = slotMapCacheBySide[cacheKey];
  const next = pinSlotEntities(entities, totalSlots, previousSlots);
  slotMapCacheBySide[cacheKey] = next.slotByEntityId;
  return next;
}
