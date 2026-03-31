// src/components/hub/home/internal/hooks/deck-state-cache.ts - Persiste snapshot local reciente del deck para evitar flashes de estado antiguo tras remount.
import { IDeck } from "@/core/entities/home/IDeck";

const HOME_DECK_CACHE_PREFIX = "home-deck-cache:";
const HOME_DECK_CACHE_TTL_MS = 5 * 60 * 1000;

interface IHomeDeckCachePayload {
  savedAt: number;
  deck: IDeck;
}

function getCacheKey(playerId: string): string {
  return `${HOME_DECK_CACHE_PREFIX}${playerId}`;
}

function isDeckShapeCompatible(candidate: IDeck, reference: IDeck): boolean {
  return candidate.playerId === reference.playerId
    && candidate.slots.length === reference.slots.length
    && candidate.fusionSlots.length === reference.fusionSlots.length;
}

/** Lee deck cacheado en cliente si es reciente y compatible con el shape actual. */
export function readCachedDeck(playerId: string, fallback: IDeck): IDeck {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.sessionStorage.getItem(getCacheKey(playerId));
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as IHomeDeckCachePayload;
    if (!parsed || typeof parsed.savedAt !== "number" || !parsed.deck) return fallback;
    if (Date.now() - parsed.savedAt > HOME_DECK_CACHE_TTL_MS) return fallback;
    return isDeckShapeCompatible(parsed.deck, fallback) ? parsed.deck : fallback;
  } catch {
    return fallback;
  }
}

/** Guarda snapshot local reciente del deck para rehidratar estado tras refresh/remount. */
export function writeCachedDeck(playerId: string, deck: IDeck): void {
  if (typeof window === "undefined") return;
  try {
    const payload: IHomeDeckCachePayload = { savedAt: Date.now(), deck };
    window.sessionStorage.setItem(getCacheKey(playerId), JSON.stringify(payload));
  } catch {
    // Cache best-effort: nunca bloquea flujo principal del builder.
  }
}
