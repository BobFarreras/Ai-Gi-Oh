// src/components/admin/internal/use-admin-starter-deck-editor.ts - Hook de estado para edición starter deck admin con selección de slot y almacén.
"use client";

import { useMemo, useState } from "react";
import {
  fetchAdminStarterDeckTemplateData,
  IAdminStarterDeckApiResponse,
  saveAdminStarterDeckTemplate,
} from "@/components/admin/admin-starter-deck-api";

interface IUseAdminStarterDeckEditorResult {
  data: IAdminStarterDeckApiResponse;
  selectedSlotIndex: number | null;
  setSelectedSlotIndex: (slotIndex: number | null) => void;
  selectedCollectionCardId: string | null;
  setSelectedCollectionCardId: (cardId: string | null) => void;
  isEditMode: boolean;
  setIsEditMode: (value: boolean) => void;
  activateOnSave: boolean;
  setActivateOnSave: (value: boolean) => void;
  draftCardIds: Array<string | null>;
  setDraftCardIdBySlot: (slotIndex: number, cardId: string) => void;
  clearSlotCardByIndex: (slotIndex: number) => void;
  swapSlots: (fromSlotIndex: number, toSlotIndex: number) => void;
  canSave: boolean;
  isBusy: boolean;
  feedback: string;
  onSelectTemplate: (templateKey: string) => Promise<void>;
  onRefresh: () => Promise<void>;
  onSave: () => Promise<void>;
}

function resolveInitialDraft(data: IAdminStarterDeckApiResponse): Array<string | null> {
  return data.template?.slots.map((slot) => slot.cardId) ?? [];
}

/**
 * Centraliza ciclo de edición para evitar lógica de red dispersa en la vista.
 */
export function useAdminStarterDeckEditor(initialData: IAdminStarterDeckApiResponse): IUseAdminStarterDeckEditorResult {
  const [data, setData] = useState<IAdminStarterDeckApiResponse>(initialData);
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(0);
  const [selectedCollectionCardId, setSelectedCollectionCardId] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [activateOnSave, setActivateOnSave] = useState(false);
  const [draftCardIds, setDraftCardIds] = useState<Array<string | null>>(resolveInitialDraft(initialData));
  const [isBusy, setIsBusy] = useState(false);
  const [feedback, setFeedback] = useState("");

  const selectedTemplateKey = useMemo(() => data.template?.templateKey ?? "", [data.template?.templateKey]);
  const canSave = useMemo(
    () => draftCardIds.length > 0 && draftCardIds.every((cardId) => typeof cardId === "string" && cardId.trim().length > 0),
    [draftCardIds],
  );

  async function load(templateKey?: string): Promise<void> {
    setIsBusy(true);
    try {
      const nextData = await fetchAdminStarterDeckTemplateData(templateKey);
      setData(nextData);
      setSelectedSlotIndex(0);
      setSelectedCollectionCardId(null);
      setDraftCardIds(resolveInitialDraft(nextData));
      setFeedback("");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "No se pudo cargar starter deck.");
    } finally {
      setIsBusy(false);
    }
  }

  async function onSave(): Promise<void> {
    if (!data.template) return;
    if (!canSave) {
      setFeedback("Debes completar los 20 slots antes de guardar.");
      return;
    }
    setIsBusy(true);
    try {
      const cardIds = draftCardIds.filter((cardId): cardId is string => typeof cardId === "string" && cardId.length > 0);
      await saveAdminStarterDeckTemplate({
        templateKey: data.template.templateKey,
        cardIds,
        activate: activateOnSave,
      });
      await load(data.template.templateKey);
      setIsEditMode(false);
      setFeedback("Starter deck guardado correctamente.");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "No se pudo guardar starter deck.");
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
    isEditMode,
    setIsEditMode,
    activateOnSave,
    setActivateOnSave,
    draftCardIds,
    setDraftCardIdBySlot: (slotIndex, cardId) => {
        setDraftCardIds((current) => current.map((value, index) => (index === slotIndex ? cardId : value)));
    },
    clearSlotCardByIndex: (slotIndex) => {
      setDraftCardIds((current) => current.map((value, index) => (index === slotIndex ? null : value)));
    },
    swapSlots: (fromSlotIndex, toSlotIndex) => {
      setDraftCardIds((current) => {
        const next = [...current];
        const source = next[fromSlotIndex] ?? null;
        next[fromSlotIndex] = next[toSlotIndex] ?? null;
        next[toSlotIndex] = source;
        return next;
      });
    },
    canSave,
    isBusy,
    feedback,
    onSelectTemplate: async (templateKey) => load(templateKey),
    onRefresh: async () => load(selectedTemplateKey || undefined),
    onSave,
  };
}
