// src/components/admin/internal/use-admin-story-deck-editor.ts - Hook de estado para edición admin de decks Story por oponente/deck.
"use client";

import { useMemo, useState } from "react";
import { fetchAdminStoryDeckData, IAdminStoryDeckApiResponse, saveAdminStoryDeck } from "@/components/admin/admin-story-deck-api";
import { IStorySlotLevelDraft, resolveDraft, resolveDraftSlotLevels, resolveDuelDifficulty, resolveSelectedDuelId } from "@/components/admin/internal/admin-story-duel-draft";
import { StoryOpponentDifficulty } from "@/core/entities/opponent/IStoryDuelDefinition";

interface IUseAdminStoryDeckEditorResult {
  data: IAdminStoryDeckApiResponse;
  selectedSlotIndex: number | null;
  setSelectedSlotIndex: (slotIndex: number | null) => void;
  selectedCollectionCardId: string | null;
  setSelectedCollectionCardId: (cardId: string | null) => void;
  draftCardIds: Array<string | null>;
  selectedDuelId: string | null;
  setSelectedDuelId: (duelId: string | null) => void;
  selectedDuelDifficulty: StoryOpponentDifficulty;
  setSelectedDuelDifficulty: (difficulty: StoryOpponentDifficulty) => void;
  draftSlotLevels: IStorySlotLevelDraft[];
  setDraftSlotLevelByIndex: (slotIndex: number, key: "versionTier" | "level" | "xp", value: number) => void;
  setDraftCardIdBySlot: (slotIndex: number, cardId: string) => void;
  clearSlotCardByIndex: (slotIndex: number) => void;
  swapSlots: (fromSlotIndex: number, toSlotIndex: number) => void;
  isEditMode: boolean;
  setIsEditMode: (value: boolean) => void;
  isBusy: boolean;
  feedback: string;
  canSave: boolean;
  onSelectOpponent: (opponentId: string) => Promise<void>;
  onSelectDeck: (deckListId: string) => Promise<void>;
  onRefresh: () => Promise<void>;
  onSave: () => Promise<void>;
}

export function useAdminStoryDeckEditor(initialData: IAdminStoryDeckApiResponse): IUseAdminStoryDeckEditorResult {
  const [data, setData] = useState<IAdminStoryDeckApiResponse>(initialData);
  const [draftCardIds, setDraftCardIds] = useState<Array<string | null>>(resolveDraft(initialData));
  const [selectedDuelId, setSelectedDuelId] = useState<string | null>(resolveSelectedDuelId(initialData));
  const [selectedDuelDifficulty, setSelectedDuelDifficulty] = useState<StoryOpponentDifficulty>(resolveDuelDifficulty(initialData, resolveSelectedDuelId(initialData)));
  const [draftSlotLevels, setDraftSlotLevels] = useState<IStorySlotLevelDraft[]>(resolveDraftSlotLevels(initialData, resolveSelectedDuelId(initialData)));
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(0);
  const [selectedCollectionCardId, setSelectedCollectionCardId] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [feedback, setFeedback] = useState("");
  const canSave = useMemo(() => draftCardIds.filter((cardId) => typeof cardId === "string").length > 0, [draftCardIds]);

  async function load(input: { opponentId?: string; deckListId?: string }): Promise<void> {
    setIsBusy(true);
    try {
      const nextData = await fetchAdminStoryDeckData(input);
      setData(nextData);
      setDraftCardIds(resolveDraft(nextData));
      const nextSelectedDuelId = resolveSelectedDuelId(nextData);
      setSelectedDuelId(nextSelectedDuelId);
      setSelectedDuelDifficulty(resolveDuelDifficulty(nextData, nextSelectedDuelId));
      setDraftSlotLevels(resolveDraftSlotLevels(nextData, nextSelectedDuelId));
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
      setSelectedDuelDifficulty(resolveDuelDifficulty(data, duelId));
      setDraftSlotLevels(resolveDraftSlotLevels(data, duelId));
    },
    selectedDuelDifficulty,
    setSelectedDuelDifficulty,
    draftSlotLevels,
    setDraftSlotLevelByIndex: (slotIndex, key, value) => {
      setDraftSlotLevels((current) => {
        const next = [...current];
        const row = next[slotIndex] ?? { versionTier: 0, level: 0, xp: 0 };
        next[slotIndex] = { ...row, [key]: Math.max(0, Number.isFinite(value) ? Math.trunc(value) : 0) };
        return next;
      });
    },
    setDraftCardIdBySlot: (slotIndex, cardId) => {
      setDraftCardIds((current) => {
        setDraftSlotLevels((levels) => {
          if (slotIndex < levels.length) return levels;
          return [...levels, ...Array.from({ length: slotIndex - levels.length + 1 }, () => ({ versionTier: 0, level: 0, xp: 0 }))];
        });
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
          duelConfig: selectedDuelId ? {
            duelId: selectedDuelId,
            difficulty: selectedDuelDifficulty,
            slotOverrides: draftCardIds.flatMap((cardId, slotIndex) => {
              if (!cardId) return [];
              const levels = draftSlotLevels[slotIndex] ?? { versionTier: 0, level: 0, xp: 0 };
              return [{ slotIndex, cardId, versionTier: levels.versionTier, level: levels.level, xp: levels.xp }];
            }),
          } : null,
        });
        await load({ opponentId: data.deck.opponentId, deckListId: data.deck.deckListId });
        setFeedback("Story Deck guardado correctamente.");
      } catch (error) {
        setFeedback(error instanceof Error ? error.message : "No se pudo guardar Story Deck.");
      } finally {
        setIsBusy(false);
      }
    },
  };
}

