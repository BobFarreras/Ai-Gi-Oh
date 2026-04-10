// src/components/admin/internal/use-admin-story-deck-editor.ts - Hook de estado para edición admin de decks Story por oponente/deck.
"use client";

import { useMemo, useState } from "react";
import { IAdminStoryDeckApiResponse } from "@/components/admin/admin-story-deck-api";
import { applyMassLevels, applySlotLevelToSameCards, copyLevelsFromSimilarCard, extendLevelsToSlot } from "@/components/admin/internal/admin-story-deck-editor-state";
import { IUseAdminStoryDeckEditorResult } from "@/components/admin/internal/admin-story-deck-editor-types";
import { IStorySlotLevelDraft } from "@/components/admin/internal/admin-story-duel-draft";
import { buildStoryDeckLoadSnapshot } from "@/components/admin/internal/admin-story-deck-load-state";
import { StoryAiStyle } from "@/core/services/opponent/difficulty/story-ai-profile";
import { StoryOpponentDifficulty } from "@/core/entities/opponent/IStoryDuelDefinition";
import { executeAdminStoryDeckSave } from "@/components/admin/internal/admin-story-deck-save-flow";
import { executeAdminStoryDeckLoad } from "@/components/admin/internal/admin-story-deck-load-flow";
import { applyDeckModeSelection, applyDuelDifficultyPreset, applyDuelSelection, cloneFromSourceDuel } from "@/components/admin/internal/admin-story-deck-selection-actions";

export function useAdminStoryDeckEditor(initialData: IAdminStoryDeckApiResponse): IUseAdminStoryDeckEditorResult {
  const [data, setData] = useState<IAdminStoryDeckApiResponse>(initialData);
  const [selectedOpponentId, setSelectedOpponentId] = useState<string | null>(initialData.deck?.opponentId ?? initialData.opponents[0]?.opponentId ?? null);
  const initialSnapshot = buildStoryDeckLoadSnapshot(initialData);
  const [draftCardIds, setDraftCardIds] = useState<Array<string | null>>(initialSnapshot.draftCardIds);
  const [selectedDuelId, setSelectedDuelId] = useState<string | null>(initialSnapshot.selectedDuelId);
  const [selectedDuelDifficulty, setSelectedDuelDifficulty] = useState<StoryOpponentDifficulty>(initialSnapshot.selectedDuelDifficulty);
  const [duelAiStyle, setDuelAiStyle] = useState<StoryAiStyle>(initialSnapshot.duelAiProfile.style);
  const [duelAiAggression, setDuelAiAggression] = useState<number>(initialSnapshot.duelAiProfile.aggression);
  const [draftFusionCardIds, setDraftFusionCardIds] = useState<string[]>(initialSnapshot.draftFusionCardIds);
  const [draftRewardCardIds, setDraftRewardCardIds] = useState<string[]>(initialSnapshot.draftRewardCardIds);
  const [draftSlotLevels, setDraftSlotLevels] = useState<IStorySlotLevelDraft[]>(initialSnapshot.draftSlotLevels);
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(0);
  const [selectedCollectionCardId, setSelectedCollectionCardId] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isBaseDeckMode, setIsBaseDeckMode] = useState(initialSnapshot.isBaseDeckMode);
  const [isBusy, setIsBusy] = useState(false);
  const [feedback, setFeedback] = useState("");
  const fusionCardById = useMemo(() => new Map(data.availableCards.filter((card) => card.type === "FUSION").map((card) => [card.id, card])), [data.availableCards]);
  const canSave = useMemo(() => {
    const hasBaseCards = draftCardIds.some((cardId) => typeof cardId === "string");
    const hasValidFusionDeck = draftFusionCardIds.length === 2 && draftFusionCardIds.every((cardId) => cardId.trim().length > 0 && fusionCardById.has(cardId));
    return isBaseDeckMode || !selectedDuelId ? hasBaseCards : hasBaseCards && hasValidFusionDeck;
  }, [draftCardIds, isBaseDeckMode, selectedDuelId, draftFusionCardIds, fusionCardById]);

  async function load(input: { opponentId?: string; deckListId?: string; preferredDuelId?: string | null }): Promise<void> {
    setIsBusy(true);
    try {
      await executeAdminStoryDeckLoad({
        input,
        setData,
        setSelectedOpponentId,
        setDraftCardIds,
        setSelectedDuelId,
        setSelectedDuelDifficulty,
        setDuelAiStyle,
        setDuelAiAggression, setDraftSlotLevels, setDraftFusionCardIds, setDraftRewardCardIds,
        setIsBaseDeckMode,
        setSelectedSlotIndex,
        setSelectedCollectionCardId,
        setFeedback,
      });
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "No se pudo cargar Story Deck.");
    } finally {
      setIsBusy(false);
    }
  }

  return {
    data,
    selectedOpponentId,
    selectedSlotIndex,
    setSelectedSlotIndex,
    selectedCollectionCardId,
    setSelectedCollectionCardId,
    draftCardIds,
    selectedDuelId,
    setSelectedDuelId: (duelId) => applyDuelSelection({ data, duelId, isBaseDeckMode, setSelectedDuelId, setDraftCardIds, setSelectedDuelDifficulty, setDuelAiStyle, setDuelAiAggression, setDraftSlotLevels, setDraftFusionCardIds, setDraftRewardCardIds }),
    selectedDuelDifficulty,
    setSelectedDuelDifficulty: (difficulty) => applyDuelDifficultyPreset(difficulty, setSelectedDuelDifficulty, setDuelAiStyle, setDuelAiAggression),
    duelAiStyle,
    setDuelAiStyle,
    duelAiAggression,
    setDuelAiAggression: (value) => setDuelAiAggression(Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0))),
    draftFusionCardIds,
    setDraftFusionCardIdBySlot: (slotIndex, cardId) => setDraftFusionCardIds((current) => { const next = current.length >= 2 ? [...current] : ["", ""]; next[slotIndex] = cardId; return next; }),
    clearDraftFusionCardBySlot: (slotIndex) => setDraftFusionCardIds((current) => current.map((cardId, index) => (index === slotIndex ? "" : cardId))),
    swapDraftFusionCards: (fromSlotIndex, toSlotIndex) => setDraftFusionCardIds((current) => {
      const next = current.length >= 2 ? [...current] : ["", ""];
      const source = next[fromSlotIndex] ?? "";
      next[fromSlotIndex] = next[toSlotIndex] ?? "";
      next[toSlotIndex] = source;
      return next;
    }),
    draftRewardCardIds,
    setDraftRewardCardId: (cardId) => setDraftRewardCardIds(cardId ? [cardId] : []),
    clearDraftRewardCard: () => setDraftRewardCardIds([]),
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
    swapSlots: (fromSlotIndex, toSlotIndex) => setDraftCardIds((current) => { const next = [...current]; const source = next[fromSlotIndex] ?? null; next[fromSlotIndex] = next[toSlotIndex] ?? null; next[toSlotIndex] = source; return next; }),
    isEditMode,
    setIsEditMode,
    isBaseDeckMode,
    setIsBaseDeckMode: (value) => applyDeckModeSelection(value, data, selectedDuelId, setIsBaseDeckMode, setDraftCardIds, setDraftSlotLevels, setDraftFusionCardIds, setDraftRewardCardIds),
    isBusy,
    feedback,
    setFeedbackMessage: setFeedback,
    canSave,
    onSelectOpponent: async (opponentId) => load({ opponentId }),
    onSelectDuelReference: async (duelId) => {
      const duel = data.duels.find((entry) => entry.duelId === duelId);
      if (!duel) return;
      await load({ opponentId: selectedOpponentId ?? data.deck?.opponentId, deckListId: duel.deckListId, preferredDuelId: duelId });
      setIsBaseDeckMode(false);
    },
    cloneFromDuel: (duelId) => {
      cloneFromSourceDuel({ data, sourceDuelId: duelId, setSelectedDuelDifficulty, setDuelAiStyle, setDuelAiAggression, setDraftCardIds, setDraftSlotLevels, setDraftFusionCardIds, setDraftRewardCardIds, setIsBaseDeckMode });
      setIsEditMode(true);
      setFeedback("Configuración clonada en borrador. Pulsa Guardar para persistir.");
    },
    onSelectDeck: async (deckListId) => load({ opponentId: selectedOpponentId ?? data.deck?.opponentId, deckListId }),
    onRefresh: async () => load({ opponentId: selectedOpponentId ?? data.deck?.opponentId, deckListId: data.deck?.deckListId, preferredDuelId: selectedDuelId }),
    onSave: async () => {
      if (!data.deck || !canSave) return;
      setIsBusy(true);
      try {
        await executeAdminStoryDeckSave({ deckListId: data.deck.deckListId, deckOpponentId: data.deck.opponentId, selectedOpponentId, selectedDuelId, selectedDuelDifficulty, duelAiStyle, duelAiAggression, draftCardIds, draftSlotLevels, draftFusionCardIds, draftRewardCardIds, isBaseDeckMode, load });
        setFeedback(isBaseDeckMode ? "Deck base Story guardado correctamente." : "Configuración de duelo guardada correctamente.");
      } catch (error) {
        setFeedback(error instanceof Error ? error.message : "No se pudo guardar Story Deck.");
      } finally {
        setIsBusy(false);
      }
    },
  };
}

