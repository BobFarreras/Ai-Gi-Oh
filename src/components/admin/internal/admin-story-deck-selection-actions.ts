// src/components/admin/internal/admin-story-deck-selection-actions.ts - Acciones de selección para sincronizar duelo y modo de edición en el panel Story Deck.
import { IAdminStoryDeckApiResponse } from "@/components/admin/admin-story-deck-api";
import {
  resolveDraft,
  resolveDraftByDuel,
  resolveDraftFusionCardIds,
  resolveDraftRewardCardIds,
  resolveDraftSlotLevels,
  resolveDuelAiProfile,
  resolveDuelDifficulty,
} from "@/components/admin/internal/admin-story-duel-draft";
import { resolveDefaultStoryAiProfile } from "@/core/services/opponent/difficulty/story-ai-profile";
import { StoryOpponentDifficulty } from "@/core/entities/opponent/IStoryDuelDefinition";

interface IApplyDuelSelectionInput {
  data: IAdminStoryDeckApiResponse;
  duelId: string | null;
  isBaseDeckMode: boolean;
  setSelectedDuelId: (value: string | null) => void;
  setDraftCardIds: (value: Array<string | null>) => void;
  setSelectedDuelDifficulty: (value: StoryOpponentDifficulty) => void;
  setDuelAiStyle: (value: "balanced" | "aggressive" | "combo" | "control") => void;
  setDuelAiAggression: (value: number) => void;
  setDraftSlotLevels: (value: Array<{ versionTier: number; level: number; xp: number }>) => void;
  setDraftFusionCardIds: (value: string[]) => void;
  setDraftRewardCardIds: (value: string[]) => void;
}

interface ICloneDuelConfigInput {
  data: IAdminStoryDeckApiResponse;
  sourceDuelId: string;
  setSelectedDuelDifficulty: (value: StoryOpponentDifficulty) => void;
  setDuelAiStyle: (value: "balanced" | "aggressive" | "combo" | "control") => void;
  setDuelAiAggression: (value: number) => void;
  setDraftCardIds: (value: Array<string | null>) => void;
  setDraftSlotLevels: (value: Array<{ versionTier: number; level: number; xp: number }>) => void;
  setDraftFusionCardIds: (value: string[]) => void;
  setDraftRewardCardIds: (value: string[]) => void;
  setIsBaseDeckMode: (next: boolean) => void;
}

export function applyDuelSelection(input: IApplyDuelSelectionInput): void {
  input.setSelectedDuelId(input.duelId);
  input.setDraftCardIds(input.isBaseDeckMode ? resolveDraft(input.data) : resolveDraftByDuel(input.data, input.duelId));
  const difficulty = resolveDuelDifficulty(input.data, input.duelId);
  input.setSelectedDuelDifficulty(difficulty);
  const aiProfile = resolveDuelAiProfile(input.data, input.duelId, difficulty);
  input.setDuelAiStyle(aiProfile.style);
  input.setDuelAiAggression(aiProfile.aggression);
  input.setDraftSlotLevels(resolveDraftSlotLevels(input.data, input.isBaseDeckMode ? null : input.duelId));
  input.setDraftFusionCardIds(input.isBaseDeckMode ? [] : resolveDraftFusionCardIds(input.data, input.duelId));
  input.setDraftRewardCardIds(input.isBaseDeckMode ? [] : resolveDraftRewardCardIds(input.data, input.duelId));
}

export function applyDuelDifficultyPreset(
  difficulty: StoryOpponentDifficulty,
  setSelectedDuelDifficulty: (value: StoryOpponentDifficulty) => void,
  setDuelAiStyle: (value: "balanced" | "aggressive" | "combo" | "control") => void,
  setDuelAiAggression: (value: number) => void,
): void {
  setSelectedDuelDifficulty(difficulty);
  const next = resolveDefaultStoryAiProfile(difficulty);
  setDuelAiStyle(next.style);
  setDuelAiAggression(next.aggression);
}

export function applyDeckModeSelection(
  value: boolean,
  data: IAdminStoryDeckApiResponse,
  selectedDuelId: string | null,
  setIsBaseDeckMode: (next: boolean) => void,
  setDraftCardIds: (value: Array<string | null>) => void,
  setDraftSlotLevels: (value: Array<{ versionTier: number; level: number; xp: number }>) => void,
  setDraftFusionCardIds: (value: string[]) => void,
  setDraftRewardCardIds: (value: string[]) => void,
): void {
  setIsBaseDeckMode(value);
  if (value) {
    setDraftCardIds(resolveDraft(data));
    setDraftSlotLevels(resolveDraftSlotLevels(data, null));
    setDraftFusionCardIds([]);
    setDraftRewardCardIds([]);
    return;
  }
  setDraftCardIds(resolveDraftByDuel(data, selectedDuelId));
  setDraftSlotLevels(resolveDraftSlotLevels(data, selectedDuelId));
  setDraftFusionCardIds(resolveDraftFusionCardIds(data, selectedDuelId));
  setDraftRewardCardIds(resolveDraftRewardCardIds(data, selectedDuelId));
}

/**
 * Clona dificultad, perfil IA y override de cartas desde otro duelo Story al draft actual.
 */
export function cloneFromSourceDuel(input: ICloneDuelConfigInput): void {
  const nextDifficulty = resolveDuelDifficulty(input.data, input.sourceDuelId);
  const nextAiProfile = resolveDuelAiProfile(input.data, input.sourceDuelId, nextDifficulty);
  input.setSelectedDuelDifficulty(nextDifficulty);
  input.setDuelAiStyle(nextAiProfile.style);
  input.setDuelAiAggression(nextAiProfile.aggression);
  input.setDraftCardIds(resolveDraftByDuel(input.data, input.sourceDuelId));
  input.setDraftSlotLevels(resolveDraftSlotLevels(input.data, input.sourceDuelId));
  input.setDraftFusionCardIds(resolveDraftFusionCardIds(input.data, input.sourceDuelId));
  input.setDraftRewardCardIds(resolveDraftRewardCardIds(input.data, input.sourceDuelId));
  input.setIsBaseDeckMode(false);
}
