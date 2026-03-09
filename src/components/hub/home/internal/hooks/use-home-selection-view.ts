// src/components/hub/home/internal/hooks/use-home-selection-view.ts - Deriva estado de selección y capacidad de acciones para el builder de Home.
import { useMemo } from "react";
import { ICollectionCard } from "@/core/entities/home/ICollectionCard";
import { IDeck } from "@/core/entities/home/IDeck";
import { IPlayerCardProgress } from "@/core/entities/progression/IPlayerCardProgress";
import { HOME_MAX_DUPLICATES, countAssignedCopies, countDeckCopies } from "@/core/services/home/deck-rules";
import { getCopiesNeededForNextVersion } from "@/core/services/progression/card-version-rules";
import { buildHomeCollectionView } from "@/components/hub/home/home-collection-view";
import {
  HomeCollectionOrderDirection,
  HomeCollectionOrderField,
  HomeCollectionTypeFilter,
} from "@/components/hub/home/home-filters";
import { IHomeEvolutionOverlayState } from "@/components/hub/home/internal/types/home-deck-builder-types";

interface IUseHomeSelectionViewInput {
  deck: IDeck;
  collectionState: ICollectionCard[];
  cardProgressById: Map<string, IPlayerCardProgress>;
  selectedSlotIndex: number | null;
  selectedFusionSlotIndex: number | null;
  selectedCollectionCardId: string | null;
  nameQuery: string;
  typeFilter: HomeCollectionTypeFilter;
  orderField: HomeCollectionOrderField;
  orderDirection: HomeCollectionOrderDirection;
  evolutionOverlay: IHomeEvolutionOverlayState | null;
}

/**
 * Deriva la vista seleccionada y permisos de acción a partir de estado bruto del deck/colección.
 */
export function useHomeSelectionView(input: IUseHomeSelectionViewInput) {
  const {
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
  } = input;
  const cardById = useMemo(() => new Map(collectionState.map((entry) => [entry.card.id, entry.card])), [collectionState]);
  const selectedCardId = useMemo(() => {
    if (selectedCollectionCardId) return selectedCollectionCardId;
    if (selectedFusionSlotIndex !== null) return deck.fusionSlots[selectedFusionSlotIndex]?.cardId ?? null;
    if (selectedSlotIndex === null) return null;
    return deck.slots[selectedSlotIndex]?.cardId ?? null;
  }, [deck.fusionSlots, deck.slots, selectedCollectionCardId, selectedFusionSlotIndex, selectedSlotIndex]);
  // Copias "storage" = copias en colección no asignadas actualmente al deck/fusión.
  const selectedCard = selectedCardId ? cardById.get(selectedCardId) ?? null : null;
  const selectedSlotHasCard = selectedSlotIndex !== null && deck.slots[selectedSlotIndex].cardId !== null;
  const selectedFusionSlotHasCard = selectedFusionSlotIndex !== null && deck.fusionSlots[selectedFusionSlotIndex].cardId !== null;
  const selectedCardProgress = selectedCardId ? (cardProgressById.get(selectedCardId) ?? null) : null;
  const selectedCardVersionTier = selectedCardProgress?.versionTier ?? 0;
  const selectedCardLevel = selectedCardProgress?.level ?? 0;
  const selectedCardXp = selectedCardProgress?.xp ?? 0;
  const selectedCardMasteryPassiveSkillId = selectedCardProgress?.masteryPassiveSkillId ?? null;
  const selectedCardCopies = selectedCardId ? (collectionState.find((entry) => entry.card.id === selectedCardId)?.ownedCopies ?? 0) : 0;
  const selectedCardDeckCopies = selectedCardId ? countDeckCopies(deck, selectedCardId) : 0;
  const selectedCardAssignedCopies = selectedCardId ? countAssignedCopies(deck, selectedCardId) : 0;
  const selectedCardStorageCopies = selectedCardId ? Math.max(0, selectedCardCopies - selectedCardAssignedCopies) : 0;
  const selectedCollectionCardType: string | null = selectedCollectionCardId
    ? (collectionState.find((entry) => entry.card.id === selectedCollectionCardId)?.card.type ?? null)
    : null;
  const firstEmptyFusionSlotIndex = deck.fusionSlots.findIndex((slot) => slot.cardId === null);
  const targetFusionSlotIndex = selectedFusionSlotIndex ?? (firstEmptyFusionSlotIndex >= 0 ? firstEmptyFusionSlotIndex : null);
  // Inserción válida según tipo, límite de duplicados y disponibilidad real en storage.
  const canInsertSelectedCard = Boolean(selectedCollectionCardId) && (
    selectedCollectionCardType === "FUSION"
      ? targetFusionSlotIndex !== null && selectedCardStorageCopies > 0
      : selectedCollectionCardType !== "FUSION" && selectedCardDeckCopies < HOME_MAX_DUPLICATES && selectedCardStorageCopies > 0
  );
  const copiesRequiredToEvolve = selectedCardId ? getCopiesNeededForNextVersion(selectedCardVersionTier) : null;
  // Evolución solo si hay copias suficientes y no hay overlay activo para evitar doble submit.
  const canEvolveSelectedCard =
    Boolean(selectedCardId) &&
    copiesRequiredToEvolve !== null &&
    selectedCardStorageCopies >= copiesRequiredToEvolve &&
    evolutionOverlay === null;
  const filteredCollection = useMemo(
    () => buildHomeCollectionView({ collection: collectionState, nameQuery, typeFilter, orderField, orderDirection }),
    [collectionState, nameQuery, orderDirection, orderField, typeFilter],
  );
  const evolvableCardIds = useMemo(() => {
    const ids = new Set<string>();
    for (const entry of collectionState) {
      const versionTier = cardProgressById.get(entry.card.id)?.versionTier ?? 0;
      const requiredCopies = getCopiesNeededForNextVersion(versionTier);
      const storageCopies = Math.max(0, entry.ownedCopies - countAssignedCopies(deck, entry.card.id));
      if (requiredCopies !== null && storageCopies >= requiredCopies) ids.add(entry.card.id);
    }
    return ids;
  }, [cardProgressById, collectionState, deck]);
  const evolutionCard = evolutionOverlay ? cardById.get(evolutionOverlay.cardId) ?? selectedCard : null;

  return {
    cardById,
    selectedCardId,
    selectedCard,
    selectedSlotHasCard,
    selectedFusionSlotHasCard,
    selectedCardProgress,
    selectedCardVersionTier,
    selectedCardLevel,
    selectedCardXp,
    selectedCardMasteryPassiveSkillId,
    selectedCardStorageCopies,
    selectedCollectionCardType,
    targetFusionSlotIndex,
    canInsertSelectedCard,
    copiesRequiredToEvolve,
    canEvolveSelectedCard,
    filteredCollection,
    evolvableCardIds,
    evolutionCard,
  };
}
