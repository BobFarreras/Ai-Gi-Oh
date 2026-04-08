// src/components/admin/internal/admin-story-deck-load-state.ts - Centraliza el snapshot derivado al recargar datos del editor de Story Decks.
import { IAdminStoryDeckApiResponse } from "@/components/admin/admin-story-deck-api";
import { IStoryAiProfile } from "@/core/services/opponent/difficulty/story-ai-profile";
import { StoryOpponentDifficulty } from "@/core/entities/opponent/IStoryDuelDefinition";
import {
  IStorySlotLevelDraft,
  resolveDraftByDuel,
  resolveDraftFusionCardIds,
  resolveDraftRewardCardIds,
  resolveDraftSlotLevels,
  resolveDuelAiProfile,
  resolveDuelDifficulty,
  resolveSelectedDuelId,
} from "@/components/admin/internal/admin-story-duel-draft";

export interface IStoryDeckLoadSnapshot {
  selectedDuelId: string | null;
  selectedDuelDifficulty: StoryOpponentDifficulty;
  duelAiProfile: IStoryAiProfile;
  draftCardIds: Array<string | null>;
  draftSlotLevels: IStorySlotLevelDraft[];
  draftFusionCardIds: string[];
  draftRewardCardIds: string[];
  isBaseDeckMode: boolean;
}

/**
 * Deriva en un único paso el estado dependiente de duelo tras recargar datos desde API.
 */
export function buildStoryDeckLoadSnapshot(data: IAdminStoryDeckApiResponse, preferredDuelId?: string | null): IStoryDeckLoadSnapshot {
  const selectedDuelId = preferredDuelId && data.duels.some((duel) => duel.duelId === preferredDuelId)
    ? preferredDuelId
    : resolveSelectedDuelId(data);
  const selectedDuelDifficulty = resolveDuelDifficulty(data, selectedDuelId);
  const duelAiProfile = resolveDuelAiProfile(data, selectedDuelId, selectedDuelDifficulty);
  return {
    selectedDuelId,
    selectedDuelDifficulty,
    duelAiProfile,
    draftCardIds: resolveDraftByDuel(data, selectedDuelId),
    draftSlotLevels: resolveDraftSlotLevels(data, selectedDuelId),
    draftFusionCardIds: resolveDraftFusionCardIds(data, selectedDuelId),
    draftRewardCardIds: resolveDraftRewardCardIds(data, selectedDuelId),
    isBaseDeckMode: selectedDuelId === null,
  };
}
