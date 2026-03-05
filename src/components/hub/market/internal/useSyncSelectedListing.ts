// src/components/hub/market/internal/useSyncSelectedListing.ts - Sincroniza selección de carta cuando cambia el listado visible.
import { Dispatch, SetStateAction, useEffect } from "react";
import { ICard } from "@/core/entities/ICard";
import { IMarketCardListing } from "@/core/entities/market/IMarketCardListing";

interface UseSyncSelectedListingInput {
  selectedListing: IMarketCardListing | null;
  visibleListings: IMarketCardListing[];
  setSelectedListing: Dispatch<SetStateAction<IMarketCardListing | null>>;
  setSelectedCard: Dispatch<SetStateAction<ICard | null>>;
}

export function useSyncSelectedListing(input: UseSyncSelectedListingInput): void {
  const { selectedListing, visibleListings, setSelectedListing, setSelectedCard } = input;

  useEffect(() => {
    const hasCurrentSelected = selectedListing
      ? visibleListings.some((listing) => listing.id === selectedListing.id)
      : false;
    if (hasCurrentSelected) return;
    const fallbackListing = visibleListings[0] ?? null;
    setSelectedListing(fallbackListing);
    setSelectedCard(fallbackListing?.card ?? null);
  }, [selectedListing, setSelectedCard, setSelectedListing, visibleListings]);
}
