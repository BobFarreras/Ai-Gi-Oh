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
    const row = next[index] ?? { versionTier: 0, level: 0, xp: 0 };
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
    };
  });
}

export function extendLevelsToSlot(levels: IStorySlotLevelDraft[], slotIndex: number): IStorySlotLevelDraft[] {
  if (slotIndex < levels.length) return levels;
  return [...levels, ...Array.from({ length: slotIndex - levels.length + 1 }, () => ({ versionTier: 0, level: 0, xp: 0 }))];
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
