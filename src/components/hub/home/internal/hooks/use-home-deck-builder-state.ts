// src/components/hub/home/internal/hooks/use-home-deck-builder-state.ts - Centraliza estado local y derivados de selección del módulo Home.
import { useEffect, useMemo, useState } from "react";
import { ICollectionCard } from "@/core/entities/home/ICollectionCard";
import { IDeck } from "@/core/entities/home/IDeck";
import { IPlayerCardProgress } from "@/core/entities/progression/IPlayerCardProgress";
import { ICardUpgradeBonuses } from "@/core/services/progression/card-upgrade-rules";
import { HomeCollectionOrderDirection, HomeCollectionOrderField, HomeCollectionTypeFilter } from "@/components/hub/home/home-filters";
import { IHomeDraggedCardState, IHomeEvolutionOverlayState } from "@/components/hub/home/internal/types/home-deck-builder-types";
import { useHomeSelectionView } from "@/components/hub/home/internal/hooks/use-home-selection-view";
import { readCachedDeck, writeCachedDeck } from "@/components/hub/home/internal/hooks/deck-state-cache";

interface IUseHomeDeckBuilderStateInput {
  playerId: string;
  initialDeck: IDeck;
  collection: ICollectionCard[];
  initialCardProgress: IPlayerCardProgress[];
  initialCardUpgrades: Record<string, ICardUpgradeBonuses>;
}

/**
 * Centraliza estado mutable del builder y conecta derivados de selección en una sola salida tipada.
 */
export function useHomeDeckBuilderState(input: IUseHomeDeckBuilderStateInput) {
  // Doble Arsenal: qué mazo se está editando (PRINCIPAL = activo, SECONDARY = 2º mazo/banco). Al cambiar, la
  // escena recarga el mazo correspondiente en `deck`. La caché se separa por slot para no mezclar snapshots.
  const [editingDeckSlot, setEditingDeckSlot] = useState<"PRINCIPAL" | "SECONDARY">("PRINCIPAL");
  const [deck, setDeck] = useState<IDeck>(() => readCachedDeck(input.playerId, input.initialDeck));
  const [collectionState, setCollectionState] = useState<ICollectionCard[]>(input.collection);
  const [cardProgressById, setCardProgressById] = useState<Map<string, IPlayerCardProgress>>(
    () => new Map(input.initialCardProgress.map((progress) => [progress.cardId, progress])),
  );
  const [cardUpgradesById, setCardUpgradesById] = useState<Map<string, ICardUpgradeBonuses>>(
    () => new Map(Object.entries(input.initialCardUpgrades)),
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
  useEffect(() => {
    writeCachedDeck(input.playerId, deck, editingDeckSlot);
  }, [deck, editingDeckSlot, input.playerId]);
  // Contexto único que consumen acciones y handlers para mantener consistencia de snapshot. `deckSlot` decide
  // si las operaciones escriben en el mazo activo o en el 2º mazo (banco).
  const context = { playerId: input.playerId, deck, collection: collectionState, deckSlot: editingDeckSlot };
  const deckCardCount = useMemo(() => deck.slots.filter((slot) => slot.cardId !== null).length, [deck.slots]);
  const selectionView = useHomeSelectionView({
    deck,
    collectionState,
    cardProgressById,
    cardUpgradesById,
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
    cardUpgradesById,
    setCardUpgradesById,
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
    editingDeckSlot,
    setEditingDeckSlot,
    deckCardCount,
    ...selectionView,
  };
}
