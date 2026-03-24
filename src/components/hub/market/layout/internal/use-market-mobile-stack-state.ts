// src/components/hub/market/layout/internal/use-market-mobile-stack-state.ts - Encapsula estado y handlers del stack móvil del mercado para mantener MarketMobileStack enfocado en render.
"use client";

import { startTransition, useMemo, useState } from "react";
import { ICard } from "@/core/entities/ICard";
import { IMarketCardListing } from "@/core/entities/market/IMarketCardListing";
import { MobilePanel } from "@/components/hub/market/layout/MarketMobileStack";

const TUTORIAL_PRIMARY_PACK_ID = "tutorial-market-pack-gemgpt";

interface IUseMarketMobileStackStateInput {
  tutorialForcedPanel?: MobilePanel | null;
  tutorialForceInspectorOpen?: boolean;
  tutorialCurrentStepId?: string | null;
  packs: Array<{ id: string; previewCardIds: string[] }>;
  selectedPackId: string | null;
  catalogListings: IMarketCardListing[];
  onShowFreeListings: () => void;
  onSelectListing: (listing: IMarketCardListing) => void;
  onSelectVaultCard: (card: ICard) => void;
  playSfx: (name: string) => void;
}

/**
 * Gestiona modo panel, inspector y selección de pack para tutorial en layout móvil.
 */
export function useMarketMobileStackState(input: IUseMarketMobileStackStateInput) {
  const [activePanel, setActivePanel] = useState<MobilePanel>("LISTINGS");
  const [visitedPanels, setVisitedPanels] = useState<Record<MobilePanel, boolean>>({ LISTINGS: true, PACKS: false, VAULT: false });
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);
  const effectiveActivePanel: MobilePanel = input.tutorialForcedPanel ?? activePanel;
  const isInspectorOpenEffective = input.tutorialForceInspectorOpen ? true : isInspectorOpen;
  const isPackTutorialStep =
    input.tutorialCurrentStepId === "market-pack-selection" ||
    input.tutorialCurrentStepId === "market-pack-preview-cards" ||
    input.tutorialCurrentStepId === "market-buy-pack" ||
    input.tutorialCurrentStepId === "market-pack-random-explanation";
  const tutorialFallbackPackId = input.packs.find((pack) => pack.id === TUTORIAL_PRIMARY_PACK_ID)?.id ?? input.packs[0]?.id ?? null;
  const effectiveSelectedPackId = input.selectedPackId ?? (isPackTutorialStep ? tutorialFallbackPackId : null);
  const packListings = useMemo(() => {
    if (!effectiveSelectedPackId) return [];
    const selectedPack = input.packs.find((pack) => pack.id === effectiveSelectedPackId);
    if (!selectedPack) return [];
    const packCardIds = new Set(selectedPack.previewCardIds);
    return input.catalogListings.filter((listing) => packCardIds.has(listing.card.id));
  }, [effectiveSelectedPackId, input.catalogListings, input.packs]);

  const handleSelectListing = (listing: IMarketCardListing) => {
    input.onSelectListing(listing);
    setIsInspectorOpen(true);
    window.requestAnimationFrame(() => input.playSfx("DETAIL_OPEN"));
  };

  const handleSelectVaultCard = (card: ICard) => {
    input.onSelectVaultCard(card);
    setIsInspectorOpen(true);
    window.requestAnimationFrame(() => input.playSfx("DETAIL_OPEN"));
  };

  const switchPanel = (panel: MobilePanel) => {
    if (effectiveActivePanel !== panel) input.playSfx("SECTION_SWITCH");
    setActivePanel(panel);
    setVisitedPanels((previous) => (previous[panel] ? previous : { ...previous, [panel]: true }));
    if (panel === "LISTINGS") startTransition(input.onShowFreeListings);
  };

  return {
    visitedPanels,
    effectiveActivePanel,
    isInspectorOpenEffective,
    effectiveSelectedPackId,
    packListings,
    handleSelectListing,
    handleSelectVaultCard,
    switchPanel,
    closeInspector: () => setIsInspectorOpen(false),
  };
}
