// src/components/hub/home/layout/home-mobile-deck-view.ts - Helpers de filtrado para la vista de deck en mobile.
import { IDeck } from "@/core/entities/home/IDeck";
import { ICard } from "@/core/entities/ICard";
import { HomeCollectionTypeFilter } from "@/components/hub/home/home-filters";

interface BuildMobileDeckViewInput {
  deck: IDeck;
  cardById: Map<string, ICard>;
  nameQuery: string;
  typeFilter: HomeCollectionTypeFilter;
}

export function buildHomeMobileDeckSlotsView(input: BuildMobileDeckViewInput) {
  const normalizedQuery = input.nameQuery.trim().toLowerCase();
  const hasFilters = normalizedQuery.length > 0 || input.typeFilter !== "ALL";
  if (!hasFilters) return input.deck.slots;
  return input.deck.slots.filter((slot) => {
    if (!slot.cardId) return false;
    const card = input.cardById.get(slot.cardId);
    if (!card) return false;
    const matchesType = input.typeFilter === "ALL" || card.type === input.typeFilter;
    const matchesName = normalizedQuery.length === 0 || card.name.toLowerCase().includes(normalizedQuery);
    return matchesType && matchesName;
  });
}
