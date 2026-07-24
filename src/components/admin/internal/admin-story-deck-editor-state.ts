// src/components/admin/internal/admin-story-deck-editor-state.ts - Utilidades puras de transformación de draft para editor Story Deck admin.
import { EMPTY_SLOT_LEVEL_DRAFT, IStorySlotLevelDraft } from "@/components/admin/internal/admin-story-duel-draft";
import { getMaxCardLevel } from "@/core/services/progression/card-level-rules";
import { MAX_CARD_VERSION_TIER, MIN_CARD_VERSION_TIER } from "@/core/services/progression/card-version-rules";

export function applySlotLevelToSameCards(
  levels: IStorySlotLevelDraft[],
  draftCardIds: Array<string | null>,
  slotIndex: number,
  key: "versionTier" | "level" | "xp",
  rawValue: number,
): IStorySlotLevelDraft[] {
  const next = [...levels];
  const normalizedValue = Math.max(0, Number.isFinite(rawValue) ? Math.trunc(rawValue) : 0);
  const sourceCardId = draftCardIds[slotIndex];
  for (let index = 0; index < next.length; index += 1) {
    if (!sourceCardId || draftCardIds[index] !== sourceCardId) continue;
    const row = next[index] ?? { ...EMPTY_SLOT_LEVEL_DRAFT };
    next[index] = { ...row, [key]: normalizedValue };
  }
  return next;
}

/**
 * Edición masiva del escalado. Los topes salen de las reglas del juego: estaban clavados a 30 (el nivel máximo
 * de hace dos versiones), así que "Aplicar todas" recortaba en silencio cualquier nivel por encima de 30 y
 * parecía que no se guardaba lo que habías puesto.
 */
export function applyMassLevels(
  levels: IStorySlotLevelDraft[],
  draftCardIds: Array<string | null>,
  input: { versionTier: number; level: number; xp: number },
): IStorySlotLevelDraft[] {
  return levels.map((row, slotIndex) => {
    if (!draftCardIds[slotIndex]) return row;
    return {
      versionTier: Math.max(MIN_CARD_VERSION_TIER, Math.min(MAX_CARD_VERSION_TIER, Math.trunc(input.versionTier))),
      level: Math.max(0, Math.min(getMaxCardLevel(), Math.trunc(input.level))),
      xp: Math.max(0, Math.trunc(input.xp)),
      // Los objetos equipados (override de stats) no los toca el escalado masivo.
      attackOverride: row?.attackOverride ?? null,
      defenseOverride: row?.defenseOverride ?? null,
    };
  });
}

/** Fija el override de un stat (objetos equipados) en un slot; se aplica a todas las copias de la misma carta. */
export function applySlotOverrideToSameCards(
  levels: IStorySlotLevelDraft[],
  draftCardIds: Array<string | null>,
  slotIndex: number,
  stat: "ATTACK" | "DEFENSE",
  value: number | null,
): IStorySlotLevelDraft[] {
  const next = [...levels];
  const key = stat === "ATTACK" ? "attackOverride" : "defenseOverride";
  const sourceCardId = draftCardIds[slotIndex];
  for (let index = 0; index < next.length; index += 1) {
    if (!sourceCardId || draftCardIds[index] !== sourceCardId) continue;
    const row = next[index] ?? { ...EMPTY_SLOT_LEVEL_DRAFT };
    next[index] = { ...row, [key]: value };
  }
  return next;
}

export function extendLevelsToSlot(levels: IStorySlotLevelDraft[], slotIndex: number): IStorySlotLevelDraft[] {
  if (slotIndex < levels.length) return levels;
  return [...levels, ...Array.from({ length: slotIndex - levels.length + 1 }, () => ({ ...EMPTY_SLOT_LEVEL_DRAFT }))];
}

/**
 * Escalado del slot al COLOCAR una carta. La configuración es de la CARTA, no del hueco: si ya hay otra copia de
 * esa misma carta en el deck se hereda la suya (invariante de "todas las copias iguales"), y si no, el slot
 * arranca LIMPIO. Antes solo se copiaba de la copia similar y, sin ella, el hueco conservaba el nivel y los
 * atributos de la carta ANTERIOR: metías una carta nueva y aparecía ya subida de nivel y con objetos que no le
 * habías puesto (y esos números viajaban a otros rivales al clonar el duelo).
 */
export function resolveLevelsForPlacedCard(
  levels: IStorySlotLevelDraft[],
  draftCardIds: Array<string | null>,
  slotIndex: number,
  cardId: string,
): IStorySlotLevelDraft[] {
  const next = [...levels];
  if (slotIndex >= next.length) return next;
  const similarCardIndex = draftCardIds.findIndex((value, index) => index !== slotIndex && value === cardId);
  const source = similarCardIndex >= 0 && similarCardIndex < next.length ? next[similarCardIndex] : null;
  next[slotIndex] = source ? { ...source } : { ...EMPTY_SLOT_LEVEL_DRAFT };
  return next;
}

/** Deja el escalado del slot en blanco (al vaciar el hueco), para que la siguiente carta no herede nada. */
export function clearLevelsAtSlot(levels: IStorySlotLevelDraft[], slotIndex: number): IStorySlotLevelDraft[] {
  if (slotIndex < 0 || slotIndex >= levels.length) return levels;
  return levels.map((row, index) => (index === slotIndex ? { ...EMPTY_SLOT_LEVEL_DRAFT } : row));
}

/** El escalado viaja CON la carta: al intercambiar dos huecos se intercambian también sus atributos. */
export function swapLevelsBetweenSlots(
  levels: IStorySlotLevelDraft[],
  fromSlotIndex: number,
  toSlotIndex: number,
): IStorySlotLevelDraft[] {
  const size = Math.max(levels.length, fromSlotIndex + 1, toSlotIndex + 1);
  const next = Array.from({ length: size }, (_, index) => levels[index] ?? { ...EMPTY_SLOT_LEVEL_DRAFT });
  const source = next[fromSlotIndex];
  next[fromSlotIndex] = next[toSlotIndex];
  next[toSlotIndex] = source;
  return next;
}
