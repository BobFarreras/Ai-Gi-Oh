// src/components/admin/internal/use-admin-story-deck-editor.ts - Hook de estado para edición admin de decks Story por oponente/deck.
"use client";

import { useMemo, useState } from "react";
import { fetchAdminStoryDeckData, IAdminStoryDeckApiResponse, saveAdminStoryDeck } from "@/components/admin/admin-story-deck-api";
import { applyMassLevels, applySlotLevelToSameCards, copyLevelsFromSimilarCard, extendLevelsToSlot } from "@/components/admin/internal/admin-story-deck-editor-state";
import { IUseAdminStoryDeckEditorResult } from "@/components/admin/internal/admin-story-deck-editor-types";
import { IStorySlotLevelDraft, resolveDraft, resolveDraftByDuel, resolveDraftSlotLevels, resolveDuelAiProfile, resolveDuelDifficulty, resolveSelectedDuelId } from "@/components/admin/internal/admin-story-duel-draft";
import { StoryAiStyle, resolveDefaultStoryAiProfile } from "@/core/services/opponent/difficulty/story-ai-profile";
import { StoryOpponentDifficulty } from "@/core/entities/opponent/IStoryDuelDefinition";

export function useAdminStoryDeckEditor(initialData: IAdminStoryDeckApiResponse): IUseAdminStoryDeckEditorResult {
  const [data, setData] = useState<IAdminStoryDeckApiResponse>(initialData);
  const initialSelectedDuelId = resolveSelectedDuelId(initialData);
  const [draftCardIds, setDraftCardIds] = useState<Array<string | null>>(resolveDraftByDuel(initialData, initialSelectedDuelId));
  const [selectedDuelId, setSelectedDuelId] = useState<string | null>(initialSelectedDuelId);
  const [selectedDuelDifficulty, setSelectedDuelDifficulty] = useState<StoryOpponentDifficulty>(resolveDuelDifficulty(initialData, initialSelectedDuelId));
  const initialDuelAiProfile = resolveDuelAiProfile(initialData, initialSelectedDuelId, resolveDuelDifficulty(initialData, initialSelectedDuelId));
  const [duelAiStyle, setDuelAiStyle] = useState<StoryAiStyle>(initialDuelAiProfile.style);
  const [duelAiAggression, setDuelAiAggression] = useState<number>(initialDuelAiProfile.aggression);
  const [draftSlotLevels, setDraftSlotLevels] = useState<IStorySlotLevelDraft[]>(resolveDraftSlotLevels(initialData, initialSelectedDuelId));
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(0);
  const [selectedCollectionCardId, setSelectedCollectionCardId] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isBaseDeckMode, setIsBaseDeckMode] = useState(initialSelectedDuelId === null);
  const [isBusy, setIsBusy] = useState(false);
  const [feedback, setFeedback] = useState("");
  const canSave = useMemo(() => draftCardIds.filter((cardId) => typeof cardId === "string").length > 0, [draftCardIds]);

  async function load(input: { opponentId?: string; deckListId?: string }): Promise<void> {
    setIsBusy(true);
    try {
      const nextData = await fetchAdminStoryDeckData(input);
      setData(nextData);
      const nextSelectedDuelId = resolveSelectedDuelId(nextData);
      setDraftCardIds(resolveDraftByDuel(nextData, nextSelectedDuelId));
      setSelectedDuelId(nextSelectedDuelId);
      const nextDifficulty = resolveDuelDifficulty(nextData, nextSelectedDuelId);
      setSelectedDuelDifficulty(nextDifficulty);
      const nextAiProfile = resolveDuelAiProfile(nextData, nextSelectedDuelId, nextDifficulty);
      setDuelAiStyle(nextAiProfile.style);
      setDuelAiAggression(nextAiProfile.aggression);
      setDraftSlotLevels(resolveDraftSlotLevels(nextData, nextSelectedDuelId));
      setIsBaseDeckMode(nextSelectedDuelId === null);
      setSelectedSlotIndex(0);
      setSelectedCollectionCardId(null);
      setFeedback("");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "No se pudo cargar Story Deck.");
    } finally {
      setIsBusy(false);
    }
  }

  return {
    data,
    selectedSlotIndex,
    setSelectedSlotIndex,
    selectedCollectionCardId,
    setSelectedCollectionCardId,
    draftCardIds,
    selectedDuelId,
    setSelectedDuelId: (duelId) => {
      setSelectedDuelId(duelId);
      setDraftCardIds(isBaseDeckMode ? resolveDraft(data) : resolveDraftByDuel(data, duelId));
      const nextDifficulty = resolveDuelDifficulty(data, duelId);
      setSelectedDuelDifficulty(nextDifficulty);
      const nextAiProfile = resolveDuelAiProfile(data, duelId, nextDifficulty);
      setDuelAiStyle(nextAiProfile.style);
      setDuelAiAggression(nextAiProfile.aggression);
      setDraftSlotLevels(resolveDraftSlotLevels(data, isBaseDeckMode ? null : duelId));
    },
    selectedDuelDifficulty,
    setSelectedDuelDifficulty: (difficulty) => {
      setSelectedDuelDifficulty(difficulty);
      const next = resolveDefaultStoryAiProfile(difficulty);
      setDuelAiStyle(next.style);
      setDuelAiAggression(next.aggression);
    },
    duelAiStyle,
    setDuelAiStyle,
    duelAiAggression,
    setDuelAiAggression: (value) => setDuelAiAggression(Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0))),
    draftSlotLevels,
    setDraftSlotLevelByIndex: (slotIndex, key, value) => setDraftSlotLevels((current) => applySlotLevelToSameCards(current, draftCardIds, slotIndex, key, value)),
    applyMassSlotLevels: (input) => setDraftSlotLevels((current) => applyMassLevels(current, draftCardIds, input)),
    setDraftCardIdBySlot: (slotIndex, cardId) => {
      setDraftCardIds((current) => {
        setDraftSlotLevels((levels) => extendLevelsToSlot(levels, slotIndex));
        setDraftSlotLevels((levels) => copyLevelsFromSimilarCard(levels, current, slotIndex, cardId));
        if (slotIndex < current.length) return current.map((value, index) => (index === slotIndex ? cardId : value));
        return [...current, ...Array.from({ length: slotIndex - current.length }, () => null), cardId];
      });
    },
    clearSlotCardByIndex: (slotIndex) => setDraftCardIds((current) => current.map((value, index) => (index === slotIndex ? null : value))),
    swapSlots: (fromSlotIndex, toSlotIndex) => setDraftCardIds((current) => {
      const next = [...current];
      const source = next[fromSlotIndex] ?? null;
      next[fromSlotIndex] = next[toSlotIndex] ?? null;
      next[toSlotIndex] = source;
      return next;
    }),
    isEditMode,
    setIsEditMode,
    isBaseDeckMode,
    setIsBaseDeckMode: (value) => {
      setIsBaseDeckMode(value);
      if (value) {
        setDraftCardIds(resolveDraft(data));
        setDraftSlotLevels(resolveDraftSlotLevels(data, null));
        return;
      }
      setDraftCardIds(resolveDraftByDuel(data, selectedDuelId));
      setDraftSlotLevels(resolveDraftSlotLevels(data, selectedDuelId));
    },
    isBusy,
    feedback,
    canSave,
    onSelectOpponent: async (opponentId) => load({ opponentId }),
    onSelectDeck: async (deckListId) => load({ opponentId: data.deck?.opponentId, deckListId }),
    onRefresh: async () => load({ opponentId: data.deck?.opponentId, deckListId: data.deck?.deckListId }),
    onSave: async () => {
      if (!data.deck || !canSave) return;
      setIsBusy(true);
      try {
        const compactCardIds = draftCardIds.filter((cardId): cardId is string => typeof cardId === "string" && cardId.trim().length > 0);
        await saveAdminStoryDeck({
          deckListId: data.deck.deckListId,
          cardIds: compactCardIds,
          duelConfig: !isBaseDeckMode && selectedDuelId ? {
            duelId: selectedDuelId,
            difficulty: selectedDuelDifficulty,
            aiProfile: { style: duelAiStyle, aggression: duelAiAggression },
            slotOverrides: draftCardIds.flatMap((cardId, slotIndex) => {
              if (!cardId) return [];
              const levels = draftSlotLevels[slotIndex] ?? { versionTier: 0, level: 0, xp: 0 };
              return [{ slotIndex, cardId, versionTier: levels.versionTier, level: levels.level, xp: levels.xp }];
            }),
          } : null,
          updateBaseDeck: isBaseDeckMode,
        });
        await load({ opponentId: data.deck.opponentId, deckListId: data.deck.deckListId });
        setFeedback(isBaseDeckMode ? "Deck base Story guardado correctamente." : "Configuración de duelo guardada correctamente.");
      } catch (error) {
        setFeedback(error instanceof Error ? error.message : "No se pudo guardar Story Deck.");
      } finally {
        setIsBusy(false);
      }
    },
  };
}

