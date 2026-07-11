// src/core/services/promotions/seen-promotions.ts - Gestión de promociones vistas en localStorage para controlar el badge de novedades.

const STORAGE_KEY = "seen_promotions";

/** Lee los IDs de promociones ya vistas desde localStorage. */
export function getSeenPromotionIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [];
  }
}

/** Guarda los IDs de promociones como vistas (merge con las existentes). */
export function markPromotionsAsSeen(ids: string[]): void {
  if (typeof window === "undefined") return;
  try {
    const existing = getSeenPromotionIds();
    const merged = [...new Set([...existing, ...ids])];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  } catch {
    // Silencioso: si localStorage no está disponible, se ignora.
  }
}

/** Retorna true si hay al menos una promoción que no ha sido vista. */
export function hasUnseenPromotions(allIds: string[]): boolean {
  if (allIds.length === 0) return false;
  const seen = getSeenPromotionIds();
  return allIds.some((id) => !seen.includes(id));
}

/** Cuenta cuántas promociones no han sido vistas. */
export function countUnseenPromotions(allIds: string[]): number {
  if (allIds.length === 0) return 0;
  const seen = getSeenPromotionIds();
  return allIds.filter((id) => !seen.includes(id)).length;
}
