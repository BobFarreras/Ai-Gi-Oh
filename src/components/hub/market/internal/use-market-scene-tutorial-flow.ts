// src/components/hub/market/internal/use-market-scene-tutorial-flow.ts - Encapsula reglas tutoriales y handlers de interacción de MarketScene para mantener SRP en la vista.
"use client";

import { startTransition, useCallback, useEffect, useRef } from "react";
import { ICard } from "@/core/entities/ICard";
import { IMarketPurchaseActionOverrides, IMarketTutorialActions } from "@/components/hub/market/internal/market-tutorial-contract";
import { useMarketSceneState } from "@/components/hub/market/internal/useMarketSceneState";
import { MobilePanel } from "@/components/hub/market/layout/MarketMobileStack";

const TUTORIAL_PRIMARY_PACK_ID = "tutorial-market-pack-gemgpt";

interface IUseMarketSceneTutorialFlowInput {
  state: ReturnType<typeof useMarketSceneState>;
  tutorialActions?: IMarketTutorialActions;
  tutorialCurrentStepId?: string | null;
  tutorialAutoBuyPackRequestId?: number;
  purchaseActionOverrides?: IMarketPurchaseActionOverrides;
}

/**
 * Concentra la lógica guiada de tutorial y callbacks de compra/selección del mercado.
 */
export function useMarketSceneTutorialFlow(input: IUseMarketSceneTutorialFlowInput) {
  const { state, tutorialActions, tutorialCurrentStepId, tutorialAutoBuyPackRequestId } = input;
  const tutorialForcedMobilePanel: MobilePanel =
    tutorialCurrentStepId === "market-mobile-section-packs" ||
    tutorialCurrentStepId === "market-pack-selection" ||
    tutorialCurrentStepId === "market-pack-preview-cards" ||
    tutorialCurrentStepId === "market-buy-pack"
      ? "PACKS"
      : tutorialCurrentStepId === "market-mobile-section-vault" ||
          tutorialCurrentStepId === "market-open-vault-collection" ||
          tutorialCurrentStepId === "market-open-history"
        ? "VAULT"
        : "LISTINGS";
  const tutorialForceInspectorOpen = tutorialCurrentStepId === "market-buy-card";
  const tutorialForceMobileFiltersOpen =
    tutorialCurrentStepId === "market-type-filter" ||
    tutorialCurrentStepId === "market-order-filter" ||
    tutorialCurrentStepId === "market-order-direction";
  const isPackFlowTutorialStep =
    tutorialCurrentStepId === "market-pack-selection" ||
    tutorialCurrentStepId === "market-pack-preview-cards" ||
    tutorialCurrentStepId === "market-buy-pack" ||
    tutorialCurrentStepId === "market-pack-random-explanation";
  const previousRevealOpenRef = useRef(state.isPackRevealOpen);
  const lastAutoBuyPackRequestRef = useRef(0);

  const handleSelectListing = useCallback((listing: ReturnType<typeof useMarketSceneState>["visibleListings"][number]) => {
    state.setSelectedListing(listing);
    state.setSelectedCard(listing.card);
  }, [state]);

  const handleSelectVaultCard = useCallback((card: ICard) => {
    const listing = state.catalog.listings.find((currentListing) => currentListing.card.id === card.id) ?? null;
    startTransition(() => {
      state.setNameQuery("");
      state.setTypeFilter("ALL");
    });
    if (!listing) {
      state.setSelectedPackId(null);
    } else if (!listing.isAvailable) {
      const matchingPack = state.catalog.packs.find((pack) => pack.previewCardIds.includes(card.id));
      state.setSelectedPackId(matchingPack?.id ?? null);
    } else {
      state.setSelectedPackId(null);
    }
    state.setSelectedListing(listing);
    state.setSelectedCard(card);
  }, [state]);

  const handleBuyCard = useCallback(
    async (listingId: string): Promise<boolean> => {
      const wasBought = await state.handleBuyCard(listingId);
      if (wasBought) tutorialActions?.onBuyCard?.();
      return wasBought;
    },
    [state, tutorialActions],
  );

  const handleSelectPack = useCallback((packId: string) => {
    state.setSelectedPackId(packId);
    tutorialActions?.onSelectPack?.(packId);
  }, [state, tutorialActions]);

  useEffect(() => {
    if (!tutorialActions) return;
    if (state.isPackRevealOpen && !previousRevealOpenRef.current) tutorialActions.onPackRevealOpen?.();
    if (!state.isPackRevealOpen && previousRevealOpenRef.current) tutorialActions.onPackRevealClose?.();
    previousRevealOpenRef.current = state.isPackRevealOpen;
  }, [state.isPackRevealOpen, tutorialActions]);

  useEffect(() => {
    if (!tutorialActions || !isPackFlowTutorialStep || state.selectedPackId) return;
    if (!state.catalog.packs.some((pack) => pack.id === TUTORIAL_PRIMARY_PACK_ID)) return;
    state.setSelectedPackId(TUTORIAL_PRIMARY_PACK_ID);
  }, [isPackFlowTutorialStep, state, tutorialActions]);

  useEffect(() => {
    if (!tutorialActions || tutorialCurrentStepId !== "market-buy-pack") return;
    const requestId = tutorialAutoBuyPackRequestId ?? 0;
    if (requestId === 0 || requestId === lastAutoBuyPackRequestRef.current) return;
    if (state.isBuyingPack || state.isPackRevealOpen) return;
    const fallbackPackId = state.catalog.packs.find((pack) => pack.id === TUTORIAL_PRIMARY_PACK_ID)?.id ?? state.catalog.packs[0]?.id ?? null;
    const packIdToBuy = state.selectedPackId ?? fallbackPackId;
    if (!packIdToBuy) return;
    lastAutoBuyPackRequestRef.current = requestId;
    if (!state.selectedPackId) state.setSelectedPackId(packIdToBuy);
    void (async () => {
      const wasBought = await state.handleBuyPack(packIdToBuy);
      if (wasBought) tutorialActions?.onBuyPack?.();
    })();
  }, [
    state,
    tutorialActions,
    tutorialAutoBuyPackRequestId,
    tutorialCurrentStepId,
  ]);

  return {
    tutorialForcedMobilePanel,
    tutorialForceInspectorOpen,
    tutorialForceMobileFiltersOpen,
    handleSelectListing,
    handleSelectVaultCard,
    handleBuyCard,
    handleSelectPack,
  };
}
