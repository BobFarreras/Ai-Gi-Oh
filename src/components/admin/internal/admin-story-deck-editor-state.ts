// src/components/admin/internal/admin-story-deck-editor-state.ts - Utilidades puras de transformación de draft para editor Story Deck admin.
import { IStorySlotLevelDraft } from "@/components/admin/internal/admin-story-duel-draft";

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
    const row = next[index] ?? { versionTier: 0, level: 0, xp: 0, attackOverride: null, defenseOverride: null };
    next[index] = { ...row, [key]: normalizedValue };
  }
  return next;
}

export function applyMassLevels(
  levels: IStorySlotLevelDraft[],
  draftCardIds: Array<string | null>,
  input: { versionTier: number; level: number; xp: number },
): IStorySlotLevelDraft[] {
  return levels.map((row, slotIndex) => {
    if (!draftCardIds[slotIndex]) return row;
    return {
      versionTier: Math.max(0, Math.min(5, Math.trunc(input.versionTier))),
      level: Math.max(0, Math.min(30, Math.trunc(input.level))),
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
    const row = next[index] ?? { versionTier: 0, level: 0, xp: 0, attackOverride: null, defenseOverride: null };
    next[index] = { ...row, [key]: value };
  }
  return next;
}

export function extendLevelsToSlot(levels: IStorySlotLevelDraft[], slotIndex: number): IStorySlotLevelDraft[] {
  if (slotIndex < levels.length) return levels;
  return [...levels, ...Array.from({ length: slotIndex - levels.length + 1 }, () => ({ versionTier: 0, level: 0, xp: 0, attackOverride: null, defenseOverride: null }))];
}

export function copyLevelsFromSimilarCard(
  levels: IStorySlotLevelDraft[],
  draftCardIds: Array<string | null>,
  slotIndex: number,
  cardId: string,
): IStorySlotLevelDraft[] {
  const next = [...levels];
  const similarCardIndex = draftCardIds.findIndex((value, index) => index !== slotIndex && value === cardId);
  if (slotIndex >= next.length || similarCardIndex < 0 || similarCardIndex >= next.length) return next;
  next[slotIndex] = { ...next[similarCardIndex] };
  return next;
}
