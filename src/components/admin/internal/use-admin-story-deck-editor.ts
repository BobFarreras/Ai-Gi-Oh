// src/components/admin/internal/use-admin-story-deck-editor.ts - Hook de estado para edición admin de decks Story por oponente/deck.
"use client";

import { useMemo, useState } from "react";
import { fetchAdminStoryDeckData, IAdminStoryDeckApiResponse, saveAdminStoryDeck } from "@/components/admin/admin-story-deck-api";

interface IUseAdminStoryDeckEditorResult {
  data: IAdminStoryDeckApiResponse;
  selectedSlotIndex: number | null;
  setSelectedSlotIndex: (slotIndex: number | null) => void;
  selectedCollectionCardId: string | null;
  setSelectedCollectionCardId: (cardId: string | null) => void;
  draftCardIds: Array<string | null>;
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

function resolveDraft(data: IAdminStoryDeckApiResponse): Array<string | null> {
  return data.deck?.slots.map((slot) => slot.cardId) ?? [];
}

export function useAdminStoryDeckEditor(initialData: IAdminStoryDeckApiResponse): IUseAdminStoryDeckEditorResult {
  const [data, setData] = useState<IAdminStoryDeckApiResponse>(initialData);
  const [draftCardIds, setDraftCardIds] = useState<Array<string | null>>(resolveDraft(initialData));
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
    setDraftCardIdBySlot: (slotIndex, cardId) => {
      setDraftCardIds((current) => {
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
        await saveAdminStoryDeck({ deckListId: data.deck.deckListId, cardIds: draftCardIds.filter((cardId): cardId is string => typeof cardId === "string" && cardId.trim().length > 0) });
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

