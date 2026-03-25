// src/components/admin/internal/use-admin-market-editor.ts - Hook de estado para gestión visual de listings y packs en admin market.
"use client";

import { useMemo, useState } from "react";
import { deleteAdminPack, fetchAdminCatalogSnapshot, saveAdminListing, saveAdminPack } from "@/components/admin/admin-catalog-api";
import { addPoolEntry, createEmptyPackDraft, createListingCommand, createListingDraft, createPackCommand, createPackDraft, IAdminMarketListingDraft, IAdminMarketPackDraft } from "@/components/admin/internal/admin-market-drafts";
import { IAdminCatalogSnapshot } from "@/core/entities/admin/IAdminCatalogSnapshot";

function firstCardId(snapshot: IAdminCatalogSnapshot): string {
  return snapshot.cards[0]?.id ?? "";
}

function firstPackId(snapshot: IAdminCatalogSnapshot): string {
  return snapshot.packs[0]?.id ?? "";
}

function toPreviewIdsText(poolEntries: IAdminMarketPackDraft["poolEntries"]): string {
  return poolEntries.map((entry) => entry.cardId).filter((cardId) => cardId.trim().length > 0).join(",");
}

export function useAdminMarketEditor(initialSnapshot: IAdminCatalogSnapshot) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [tab, setTab] = useState<"listings" | "packs">("listings");
  const [selectedCardId, setSelectedCardId] = useState(firstCardId(initialSnapshot));
  const [selectedPackId, setSelectedPackId] = useState(firstPackId(initialSnapshot));
  const [listingDraft, setListingDraft] = useState<IAdminMarketListingDraft>(() => createListingDraft(firstCardId(initialSnapshot), initialSnapshot.listings.find((entry) => entry.cardId === firstCardId(initialSnapshot)) ?? null));
  const [packDraft, setPackDraft] = useState<IAdminMarketPackDraft>(() => initialSnapshot.packs[0] ? createPackDraft(initialSnapshot.packs[0]) : createEmptyPackDraft());
  const [isPackEditMode, setIsPackEditMode] = useState(initialSnapshot.packs.length === 0);
  const [isBusy, setIsBusy] = useState(false);
  const [feedback, setFeedback] = useState("");

  const listingByCardId = useMemo(() => new Map(snapshot.listings.map((entry) => [entry.cardId, entry])), [snapshot.listings]);
  const selectedPack = useMemo(() => snapshot.packs.find((pack) => pack.id === selectedPackId) ?? null, [selectedPackId, snapshot.packs]);

  async function refresh(): Promise<void> {
    setIsBusy(true);
    try {
      const next = await fetchAdminCatalogSnapshot();
      setSnapshot(next);
      const nextCardId = next.cards.some((card) => card.id === selectedCardId) ? selectedCardId : firstCardId(next);
      const nextPackId = next.packs.some((pack) => pack.id === selectedPackId) ? selectedPackId : firstPackId(next);
      setSelectedCardId(nextCardId);
      setSelectedPackId(nextPackId);
      setListingDraft(createListingDraft(nextCardId, next.listings.find((entry) => entry.cardId === nextCardId) ?? null));
      setPackDraft(next.packs.find((pack) => pack.id === nextPackId) ? createPackDraft(next.packs.find((pack) => pack.id === nextPackId)!) : createEmptyPackDraft());
      setFeedback("");
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "No se pudo refrescar market.");
    } finally {
      setIsBusy(false);
    }
  }

  return {
    snapshot,
    tab,
    setTab,
    isBusy,
    feedback,
    selectedCardId,
    listingByCardId,
    listingDraft,
    selectedPackId,
    selectedPack,
    packDraft,
    isPackEditMode,
    selectCard: (cardId: string) => {
      setSelectedCardId(cardId);
      setListingDraft(createListingDraft(cardId, listingByCardId.get(cardId) ?? null));
      setFeedback("");
    },
    updateListingDraft: <K extends keyof IAdminMarketListingDraft>(key: K, value: IAdminMarketListingDraft[K]) => setListingDraft((current) => ({ ...current, [key]: value })),
    saveListing: async () => {
      setIsBusy(true);
      try {
        await saveAdminListing(createListingCommand(listingDraft));
        await refresh();
        setFeedback("Listing guardado correctamente.");
      } catch (error) {
        setFeedback(error instanceof Error ? error.message : "No se pudo guardar listing.");
      } finally {
        setIsBusy(false);
      }
    },
    selectPack: (packId: string) => {
      setSelectedPackId(packId);
      const pack = snapshot.packs.find((entry) => entry.id === packId);
      if (pack) setPackDraft(createPackDraft(pack));
      setIsPackEditMode(false);
      setFeedback("");
    },
    beginCreatePack: () => {
      setPackDraft(createEmptyPackDraft());
      setIsPackEditMode(true);
      setFeedback("");
    },
    beginEditPack: () => {
      if (!selectedPack) return;
      setPackDraft(createPackDraft(selectedPack));
      setIsPackEditMode(true);
      setFeedback("");
    },
    cancelPackEdit: () => {
      if (selectedPack) setPackDraft(createPackDraft(selectedPack));
      setIsPackEditMode(false);
      setFeedback("");
    },
    updatePackDraft: <K extends keyof IAdminMarketPackDraft>(key: K, value: IAdminMarketPackDraft[K]) => setPackDraft((current) => ({ ...current, [key]: value })),
    updatePackPoolEntry: (index: number, key: keyof IAdminMarketPackDraft["poolEntries"][number], value: string) => setPackDraft((current) => {
      const nextPoolEntries = current.poolEntries.map((entry, entryIndex) => entryIndex === index ? { ...entry, [key]: value } : entry);
      return { ...current, poolEntries: nextPoolEntries, previewCardIdsText: toPreviewIdsText(nextPoolEntries) };
    }),
    addPackPoolEntry: (cardId: string) => setPackDraft((current) => {
      const next = addPoolEntry(current, cardId);
      return { ...next, previewCardIdsText: toPreviewIdsText(next.poolEntries) };
    }),
    removePackPoolEntry: (index: number) => setPackDraft((current) => {
      const nextPoolEntries = current.poolEntries.filter((_, entryIndex) => entryIndex !== index);
      return { ...current, poolEntries: nextPoolEntries, previewCardIdsText: toPreviewIdsText(nextPoolEntries) };
    }),
    removePackPoolEntries: (indexes: number[]) => setPackDraft((current) => {
      const indexSet = new Set(indexes);
      const nextPoolEntries = current.poolEntries.filter((_, entryIndex) => !indexSet.has(entryIndex));
      return { ...current, poolEntries: nextPoolEntries, previewCardIdsText: toPreviewIdsText(nextPoolEntries) };
    }),
    savePack: async () => {
      setIsBusy(true);
      try {
        await saveAdminPack(createPackCommand(packDraft));
        await refresh();
        setSelectedPackId(packDraft.id);
        setIsPackEditMode(false);
        setFeedback("Pack guardado correctamente.");
      } catch (error) {
        setFeedback(error instanceof Error ? error.message : "No se pudo guardar pack.");
      } finally {
        setIsBusy(false);
      }
    },
    deletePack: async (packId: string) => {
      setIsBusy(true);
      try {
        await deleteAdminPack(packId);
        await refresh();
        setIsPackEditMode(false);
        setFeedback("Pack eliminado correctamente.");
      } catch (error) {
        setFeedback(error instanceof Error ? error.message : "No se pudo eliminar pack.");
      } finally {
        setIsBusy(false);
      }
    },
    refresh,
  };
}
