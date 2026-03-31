// src/components/admin/internal/admin-story-duel-draft.ts - Utilidades puras para resolver estado draft de duelo Story en el editor admin.
import { IAdminStoryDeckApiResponse } from "@/components/admin/admin-story-deck-api";
import { IStoryAiProfile, normalizeStoryAiProfile, resolveDefaultStoryAiProfile } from "@/core/services/opponent/difficulty/story-ai-profile";
import { StoryOpponentDifficulty } from "@/core/entities/opponent/IStoryDuelDefinition";

export interface IStorySlotLevelDraft {
  versionTier: number;
  level: number;
  xp: number;
}

export function resolveDraft(data: IAdminStoryDeckApiResponse): Array<string | null> {
  return data.deck?.slots.map((slot) => slot.cardId) ?? [];
}

export function resolveDraftByDuel(data: IAdminStoryDeckApiResponse, duelId: string | null): Array<string | null> {
  const base = resolveDraft(data);
  if (!duelId) return base;
  const overrides = data.duelDeckOverrides.filter((row) => row.duelId === duelId).sort((left, right) => left.slotIndex - right.slotIndex);
  if (overrides.length === 0) return base;
  return overrides.flatMap((row) => Array.from({ length: row.copies }, () => row.cardId));
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

export function resolveDuelAiProfile(data: IAdminStoryDeckApiResponse, duelId: string | null, difficulty: StoryOpponentDifficulty): IStoryAiProfile {
  if (!duelId) return resolveDefaultStoryAiProfile(difficulty);
  const aiProfile = data.duelAiProfiles.find((profile) => profile.duelId === duelId)?.aiProfile;
  return normalizeStoryAiProfile(aiProfile, difficulty);
}

export function resolveDraftSlotLevels(data: IAdminStoryDeckApiResponse, duelId: string | null): IStorySlotLevelDraft[] {
  const draftCardIds = resolveDraftByDuel(data, duelId);
  const maxOverrideSlot = Math.max(-1, ...data.duelDeckOverrides.filter((row) => row.duelId === duelId).map((row) => row.slotIndex));
  const size = Math.max(draftCardIds.length, maxOverrideSlot + 1);
  return Array.from({ length: size }, (_, slotIndex) => {
    const override = data.duelDeckOverrides.find((row) => row.duelId === duelId && row.slotIndex === slotIndex);
    return { versionTier: override?.versionTier ?? 0, level: override?.level ?? 0, xp: override?.xp ?? 0 };
  });
}
