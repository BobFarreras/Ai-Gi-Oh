// src/components/admin/internal/arena/use-admin-arena-deck-editor.ts - Estado del editor visual de mazos de arena (selección + draft por variante).
"use client";

import { useMemo, useState } from "react";
import { ICard } from "@/core/entities/ICard";
import { IAdminArenaCardEntry } from "@/core/entities/training/IAdminArena";
import { useAdminArena } from "@/components/admin/internal/arena/use-admin-arena";

export type ArenaDeckZone = "DECK" | "FUSION";
interface IArenaDraft {
  variantId: string;
  deck: IAdminArenaCardEntry[];
  fusion: IAdminArenaCardEntry[];
}

const EMPTY_ENTRY = (cardId: string): IAdminArenaCardEntry => ({ cardId, versionTier: null, level: null, xp: null });

/** Orquesta selección de oponente/variante y un draft editable de cartas, reutilizando useAdminArena. */
export function useAdminArenaDeckEditor() {
  const arena = useAdminArena();
  const [selectedOpponentId, setSelectedOpponentId] = useState<string | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [selectedCollectionCardId, setSelectedCollectionCardId] = useState<string | null>(null);
  const [selectedDeckRef, setSelectedDeckRef] = useState<{ zone: ArenaDeckZone; index: number } | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [draft, setDraft] = useState<IArenaDraft | null>(null);

  // Selección efectiva con fallback al primero (evita setState en efecto para fijar defaults).
  const opponent = arena.opponents.find((opp) => opp.id === selectedOpponentId) ?? arena.opponents[0] ?? null;
  const variant = opponent?.variants.find((v) => v.id === selectedVariantId) ?? opponent?.variants[0] ?? null;
  const draftMatches = draft !== null && draft.variantId === variant?.id;
  const deck = draftMatches ? draft.deck : variant?.deckCards ?? [];
  const fusion = draftMatches ? draft.fusion : variant?.fusionCards ?? [];
  const cardById = useMemo(() => new Map(arena.validCards.map((card) => [card.id, card] as const)), [arena.validCards]);

  function mutateDraft(mutator: (draft: IArenaDraft) => IArenaDraft): void {
    if (!variant || !isEditMode) return;
    const base: IArenaDraft = draftMatches ? draft : { variantId: variant.id, deck: [...deck], fusion: [...fusion] };
    setDraft(mutator(base));
  }

  function resetSelection(): void {
    setDraft(null);
    setSelectedDeckRef(null);
    setSelectedCollectionCardId(null);
  }

  const selectedEntry = selectedDeckRef ? (selectedDeckRef.zone === "DECK" ? deck : fusion)[selectedDeckRef.index] ?? null : null;
  const selectedCard: ICard | null = selectedEntry
    ? cardById.get(selectedEntry.cardId) ?? null
    : selectedCollectionCardId
      ? cardById.get(selectedCollectionCardId) ?? null
      : null;

  return {
    arena,
    opponent,
    variant,
    deck,
    fusion,
    cardById,
    isEditMode,
    setIsEditMode,
    selectedDeckRef,
    selectedCollectionCardId,
    selectedEntry,
    selectedCard,
    hasDraft: draftMatches,
    selectOpponent(id: string) {
      setSelectedOpponentId(id);
      setSelectedVariantId(arena.opponents.find((opp) => opp.id === id)?.variants[0]?.id ?? null);
      resetSelection();
    },
    selectVariant(id: string) {
      setSelectedVariantId(id);
      resetSelection();
    },
    selectCollectionCard(cardId: string) {
      setSelectedCollectionCardId(cardId);
      setSelectedDeckRef(null);
    },
    selectDeckCard(zone: ArenaDeckZone, index: number) {
      setSelectedDeckRef({ zone, index });
      setSelectedCollectionCardId(null);
    },
    addCard(zone: ArenaDeckZone, cardId: string) {
      mutateDraft((current) =>
        zone === "DECK"
          ? { ...current, deck: [...current.deck, EMPTY_ENTRY(cardId)] }
          : { ...current, fusion: [...current.fusion, EMPTY_ENTRY(cardId)] },
      );
    },
    removeCard(zone: ArenaDeckZone, index: number) {
      mutateDraft((current) => ({
        ...current,
        [zone === "DECK" ? "deck" : "fusion"]: (zone === "DECK" ? current.deck : current.fusion).filter((_, i) => i !== index),
      }));
      setSelectedDeckRef(null);
    },
    setOverride(zone: ArenaDeckZone, index: number, field: "versionTier" | "level" | "xp", value: number | null) {
      mutateDraft((current) => ({
        ...current,
        [zone === "DECK" ? "deck" : "fusion"]: (zone === "DECK" ? current.deck : current.fusion).map((entry, i) =>
          i === index ? { ...entry, [field]: value } : entry,
        ),
      }));
    },
    async saveVariant(): Promise<void> {
      if (!variant) return;
      const ok = await arena.saveVariant({
        id: variant.id,
        opponentId: variant.opponentId,
        label: variant.label,
        sortOrder: variant.sortOrder,
        isActive: variant.isActive,
        deckCards: deck,
        fusionCards: fusion,
      });
      if (ok) setDraft(null);
    },
  };
}
