// src/components/admin/internal/use-admin-card-catalog-editor.ts - Hook de estado para flujo admin de catálogo con selección, edición y guardado de cartas.
"use client";

import { useMemo, useState } from "react";
import { fetchAdminCatalogSnapshot, saveAdminCard } from "@/components/admin/admin-catalog-api";
import {
  createCommandFromDraft,
  createDraftFromEntry,
  createEmptyCardDraft,
  createPreviewCardFromDraft,
  IAdminCardCatalogDraft,
  mapEntryToCard,
} from "@/components/admin/internal/admin-card-catalog-draft";
import { applyCardTypeTemplate } from "@/components/admin/internal/admin-card-catalog-type-template";
import { IAdminCardCatalogEntry, IAdminCatalogSnapshot } from "@/core/entities/admin/IAdminCatalogSnapshot";
import { CardType } from "@/core/entities/ICard";

interface IUseAdminCardCatalogEditorResult {
  cards: IAdminCardCatalogEntry[];
  selectedCardId: string | null;
  selectedEntry: IAdminCardCatalogEntry | null;
  selectedPreviewCard: ReturnType<typeof mapEntryToCard> | null;
  draft: IAdminCardCatalogDraft;
  draftPreviewCard: ReturnType<typeof createPreviewCardFromDraft>;
  mode: "view" | "create" | "edit";
  isBusy: boolean;
  feedback: string;
  selectCard: (cardId: string) => void;
  updateDraft: <K extends keyof IAdminCardCatalogDraft>(key: K, value: IAdminCardCatalogDraft[K]) => void;
  applyTypeTemplate: (nextType: CardType, force: boolean) => void;
  beginCreate: () => void;
  beginEdit: () => void;
  cancelEdit: () => void;
  refresh: () => Promise<void>;
  save: () => Promise<void>;
}

function pickDefaultSelectedId(snapshot: IAdminCatalogSnapshot): string | null {
  return snapshot.cards[0]?.id ?? null;
}

export function useAdminCardCatalogEditor(initialSnapshot: IAdminCatalogSnapshot): IUseAdminCardCatalogEditorResult {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(pickDefaultSelectedId(initialSnapshot));
  const [mode, setMode] = useState<"view" | "create" | "edit">("view");
  const [draft, setDraft] = useState<IAdminCardCatalogDraft>(createEmptyCardDraft());
  const [isBusy, setIsBusy] = useState(false);
  const [feedback, setFeedback] = useState("");

  const selectedEntry = useMemo(
    () => snapshot.cards.find((card) => card.id === selectedCardId) ?? null,
    [selectedCardId, snapshot.cards],
  );
  const selectedPreviewCard = useMemo(() => (selectedEntry ? mapEntryToCard(selectedEntry) : null), [selectedEntry]);
  const draftPreviewCard = useMemo(() => {
    try {
      return createPreviewCardFromDraft(draft);
    } catch {
      return createPreviewCardFromDraft({ ...draft, effectJson: "" });
    }
  }, [draft]);

  async function refresh(): Promise<void> {
    setIsBusy(true);
    try {
      const nextSnapshot = await fetchAdminCatalogSnapshot();
      setSnapshot(nextSnapshot);
      const nextSelectedId = selectedCardId && nextSnapshot.cards.some((card) => card.id === selectedCardId)
        ? selectedCardId
        : pickDefaultSelectedId(nextSnapshot);
      setSelectedCardId(nextSelectedId);
      setFeedback("");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "No se pudo refrescar el catálogo.");
    } finally {
      setIsBusy(false);
    }
  }

  return {
    cards: snapshot.cards,
    selectedCardId,
    selectedEntry,
    selectedPreviewCard,
    draft,
    draftPreviewCard,
    mode,
    isBusy,
    feedback,
    selectCard: (cardId) => {
      setSelectedCardId(cardId);
      setMode("view");
      setFeedback("");
    },
    updateDraft: (key, value) => setDraft((current) => ({ ...current, [key]: value })),
    applyTypeTemplate: (nextType, force) => setDraft((current) => applyCardTypeTemplate(current, nextType, force)),
    beginCreate: () => {
      setDraft(createEmptyCardDraft());
      setMode("create");
      setFeedback("");
    },
    beginEdit: () => {
      if (!selectedEntry) return;
      setDraft(createDraftFromEntry(selectedEntry));
      setMode("edit");
      setFeedback("");
    },
    cancelEdit: () => {
      setMode("view");
      setFeedback("");
    },
    refresh,
    save: async () => {
      setIsBusy(true);
      try {
        const command = createCommandFromDraft(draft);
        await saveAdminCard(command);
        const nextSnapshot = await fetchAdminCatalogSnapshot();
        setSnapshot(nextSnapshot);
        setSelectedCardId(command.id);
        setMode("view");
        setFeedback("Carta guardada correctamente en catálogo.");
      } catch (error) {
        setFeedback(error instanceof Error ? error.message : "No se pudo guardar la carta.");
      } finally {
        setIsBusy(false);
      }
    },
  };
}
