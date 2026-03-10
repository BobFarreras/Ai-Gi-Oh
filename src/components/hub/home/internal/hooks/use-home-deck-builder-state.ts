// src/components/hub/home/internal/hooks/use-home-deck-builder-state.ts - Centraliza estado local y derivados de selección del módulo Home.
import { useMemo, useState } from "react";
import { ICollectionCard } from "@/core/entities/home/ICollectionCard";
import { IDeck } from "@/core/entities/home/IDeck";
import { IPlayerCardProgress } from "@/core/entities/progression/IPlayerCardProgress";
import { HomeCollectionOrderDirection, HomeCollectionOrderField, HomeCollectionTypeFilter } from "@/components/hub/home/home-filters";
import { IHomeDraggedCardState, IHomeEvolutionOverlayState } from "@/components/hub/home/internal/types/home-deck-builder-types";
import { useHomeSelectionView } from "@/components/hub/home/internal/hooks/use-home-selection-view";

interface IUseHomeDeckBuilderStateInput {
  playerId: string;
  initialDeck: IDeck;
  collection: ICollectionCard[];
  initialCardProgress: IPlayerCardProgress[];
}

/**
 * Centraliza estado mutable del builder y conecta derivados de selección en una sola salida tipada.
 */
export function useHomeDeckBuilderState(input: IUseHomeDeckBuilderStateInput) {
  const [deck, setDeck] = useState<IDeck>(input.initialDeck);
  const [collectionState, setCollectionState] = useState<ICollectionCard[]>(input.collection);
  const [cardProgressById, setCardProgressById] = useState<Map<string, IPlayerCardProgress>>(
    () => new Map(input.initialCardProgress.map((progress) => [progress.cardId, progress])),
  );
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null);
  const [selectedFusionSlotIndex, setSelectedFusionSlotIndex] = useState<number | null>(null);
  const [selectedCollectionCardId, setSelectedCollectionCardId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [nameQuery, setNameQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<HomeCollectionTypeFilter>("ALL");
  const [orderField, setOrderField] = useState<HomeCollectionOrderField>("NAME");
  const [orderDirection, setOrderDirection] = useState<HomeCollectionOrderDirection>("ASC");
  const [evolutionOverlay, setEvolutionOverlay] = useState<IHomeEvolutionOverlayState | null>(null);
  const [draggedCard, setDraggedCard] = useState<IHomeDraggedCardState | null>(null);
  // Contexto único que consumen acciones y handlers para mantener consistencia de snapshot.
  const context = { playerId: input.playerId, deck, collection: collectionState };
  const deckCardCount = useMemo(() => deck.slots.filter((slot) => slot.cardId !== null).length, [deck.slots]);
  const selectionView = useHomeSelectionView({
    deck,
    collectionState,
    cardProgressById,
    selectedSlotIndex,
    selectedFusionSlotIndex,
    selectedCollectionCardId,
    nameQuery,
    typeFilter,
    orderField,
    orderDirection,
    evolutionOverlay,
  });
  return {
    deck,
    setDeck,
    collectionState,
    setCollectionState,
    cardProgressById,
    setCardProgressById,
    selectedSlotIndex,
    setSelectedSlotIndex,
    selectedFusionSlotIndex,
    setSelectedFusionSlotIndex,
    selectedCollectionCardId,
    setSelectedCollectionCardId,
    errorMessage,
    setErrorMessage,
    nameQuery,
    setNameQuery,
    typeFilter,
    setTypeFilter,
    orderField,
    setOrderField,
    orderDirection,
    setOrderDirection,
    evolutionOverlay,
    setEvolutionOverlay,
    draggedCard,
    setDraggedCard,
    context,
    deckCardCount,
    ...selectionView,
  };
}
