// src/components/admin/internal/admin-story-duel-draft.ts - Utilidades puras para resolver estado draft de duelo Story en el editor admin.
import { IAdminStoryDeckApiResponse } from "@/components/admin/admin-story-deck-api";
import { StoryOpponentDifficulty } from "@/core/entities/opponent/IStoryDuelDefinition";

export interface IStorySlotLevelDraft {
  versionTier: number;
  level: number;
  xp: number;
}

export function resolveDraft(data: IAdminStoryDeckApiResponse): Array<string | null> {
  return data.deck?.slots.map((slot) => slot.cardId) ?? [];
}

export function resolveSelectedDuelId(data: IAdminStoryDeckApiResponse): string | null {
  const deckListId = data.deck?.deckListId;
  if (!deckListId) return null;
  return data.duels.find((duel) => duel.deckListId === deckListId)?.duelId ?? null;
}

export function resolveDuelDifficulty(data: IAdminStoryDeckApiResponse, duelId: string | null): StoryOpponentDifficulty {
  if (!duelId) return "ROOKIE";
  return data.duelAiProfiles.find((profile) => profile.duelId === duelId)?.difficulty ?? "ROOKIE";
}

export function resolveDraftSlotLevels(data: IAdminStoryDeckApiResponse, duelId: string | null): IStorySlotLevelDraft[] {
  const draftCardIds = resolveDraft(data);
  const maxOverrideSlot = Math.max(-1, ...data.duelDeckOverrides.filter((row) => row.duelId === duelId).map((row) => row.slotIndex));
  const size = Math.max(draftCardIds.length, maxOverrideSlot + 1);
  return Array.from({ length: size }, (_, slotIndex) => {
    const override = data.duelDeckOverrides.find((row) => row.duelId === duelId && row.slotIndex === slotIndex);
    return { versionTier: override?.versionTier ?? 0, level: override?.level ?? 0, xp: override?.xp ?? 0 };
  });
}
