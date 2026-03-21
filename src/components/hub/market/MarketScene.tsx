// src/components/hub/market/MarketScene.tsx - Orquesta la UI del mercado usando paneles modulares y estado desacoplado.
"use client";

import { MarketHeaderBar } from "@/components/hub/market/layout/MarketHeaderBar";
import { MarketDesktopGrid } from "@/components/hub/market/layout/MarketDesktopGrid";
import { MarketMobileStack } from "@/components/hub/market/layout/MarketMobileStack";
import { MarketPackRevealOverlay } from "@/components/hub/market/reveal/MarketPackRevealOverlay";
import { HubErrorDialog } from "@/components/hub/internal/HubErrorDialog";
import { useViewportWidth } from "@/components/hub/internal/use-viewport-width";
import { useMarketSceneState } from "@/components/hub/market/internal/useMarketSceneState";
import { ICard } from "@/core/entities/ICard";
import { ICollectionCard } from "@/core/entities/home/ICollectionCard";
import { IMarketTransaction } from "@/core/entities/market/IMarketTransaction";
import { IMarketCatalog } from "@/core/use-cases/market/GetMarketCatalogUseCase";
import { isDesktopLayoutViewport } from "@/components/internal/layout-breakpoints";
import { IMarketPurchaseActionOverrides, IMarketTutorialActions } from "@/components/hub/market/internal/market-tutorial-contract";
import { startTransition, useCallback, useEffect, useRef } from "react";

interface MarketSceneProps {
  playerId: string;
  initialCatalog: IMarketCatalog;
  initialTransactions: IMarketTransaction[];
  initialCollection: ICollectionCard[];
  tutorialActions?: IMarketTutorialActions;
  purchaseActionOverrides?: IMarketPurchaseActionOverrides;
  tutorialCurrentStepId?: string | null;
  tutorialAutoBuyPackRequestId?: number;
}

export function MarketScene(props: MarketSceneProps) {
  const TUTORIAL_PRIMARY_PACK_ID = "tutorial-market-pack-gemgpt";
  const state = useMarketSceneState({
    playerId: props.playerId,
    initialCatalog: props.initialCatalog,
    initialTransactions: props.initialTransactions,
    initialCollection: props.initialCollection,
    purchaseActionOverrides: props.purchaseActionOverrides,
  });
  const viewportWidth = useViewportWidth();
  const isDesktopLayout = isDesktopLayoutViewport(viewportWidth);
  const tutorialForcedMobilePanel =
    props.tutorialCurrentStepId === "market-mobile-section-packs" ||
    props.tutorialCurrentStepId === "market-pack-selection" ||
    props.tutorialCurrentStepId === "market-pack-preview-cards" ||
    props.tutorialCurrentStepId === "market-buy-pack"
      ? "PACKS"
      : props.tutorialCurrentStepId === "market-mobile-section-vault" ||
          props.tutorialCurrentStepId === "market-open-vault-collection" ||
          props.tutorialCurrentStepId === "market-open-history"
        ? "VAULT"
        : "LISTINGS";
  const tutorialForceInspectorOpen = props.tutorialCurrentStepId === "market-buy-card";
  const tutorialForceMobileFiltersOpen =
    props.tutorialCurrentStepId === "market-type-filter" ||
    props.tutorialCurrentStepId === "market-order-filter" ||
    props.tutorialCurrentStepId === "market-order-direction";
  /**
   * Selección inmediata para evitar parpadeo del inspector móvil:
   * el contenido de la carta debe estar listo antes de abrir el diálogo.
   */
  const handleSelectListing = useCallback((listing: (typeof state.visibleListings)[number]) => {
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
      if (wasBought) props.tutorialActions?.onBuyCard?.();
      return wasBought;
    },
    [props.tutorialActions, state],
  );
  const previousRevealOpenRef = useRef(state.isPackRevealOpen);
  const lastAutoBuyPackRequestRef = useRef(0);
  const selectedPackId = state.selectedPackId;
  const catalogPacks = state.catalog.packs;
  const setSelectedPackId = state.setSelectedPackId;
  const handleBuyPack = state.handleBuyPack;
  const isBuyingPack = state.isBuyingPack;
  const isPackRevealOpen = state.isPackRevealOpen;
  const isPackFlowTutorialStep =
    props.tutorialCurrentStepId === "market-pack-selection" ||
    props.tutorialCurrentStepId === "market-pack-preview-cards" ||
    props.tutorialCurrentStepId === "market-buy-pack" ||
    props.tutorialCurrentStepId === "market-pack-random-explanation";
  const handleSelectPack = useCallback((packId: string) => {
    setSelectedPackId(packId);
    props.tutorialActions?.onSelectPack?.(packId);
  }, [props.tutorialActions, setSelectedPackId]);
  useEffect(() => {
    if (!props.tutorialActions) return;
    if (state.isPackRevealOpen && !previousRevealOpenRef.current) props.tutorialActions.onPackRevealOpen?.();
    if (!state.isPackRevealOpen && previousRevealOpenRef.current) props.tutorialActions.onPackRevealClose?.();
    previousRevealOpenRef.current = state.isPackRevealOpen;
  }, [props.tutorialActions, state.isPackRevealOpen]);
  useEffect(() => {
    if (!props.tutorialActions || !isPackFlowTutorialStep || selectedPackId) return;
    const hasPrimaryPack = catalogPacks.some((pack) => pack.id === TUTORIAL_PRIMARY_PACK_ID);
    if (!hasPrimaryPack) return;
    setSelectedPackId(TUTORIAL_PRIMARY_PACK_ID);
  }, [
    catalogPacks,
    isPackFlowTutorialStep,
    props.tutorialActions,
    selectedPackId,
    setSelectedPackId,
  ]);
  useEffect(() => {
    if (!props.tutorialActions) return;
    if (props.tutorialCurrentStepId !== "market-buy-pack") return;
    const requestId = props.tutorialAutoBuyPackRequestId ?? 0;
    if (requestId === 0 || requestId === lastAutoBuyPackRequestRef.current) return;
    if (isBuyingPack || isPackRevealOpen) return;
    const fallbackPackId = catalogPacks.find((pack) => pack.id === TUTORIAL_PRIMARY_PACK_ID)?.id ?? catalogPacks[0]?.id ?? null;
    const packIdToBuy = selectedPackId ?? fallbackPackId;
    if (!packIdToBuy) return;
    lastAutoBuyPackRequestRef.current = requestId;
    if (!selectedPackId) setSelectedPackId(packIdToBuy);
    void (async () => {
      const wasBought = await handleBuyPack(packIdToBuy);
      if (wasBought) props.tutorialActions?.onBuyPack?.();
    })();
  }, [
    catalogPacks,
    handleBuyPack,
    isBuyingPack,
    isPackRevealOpen,
    props.tutorialActions,
    props.tutorialAutoBuyPackRequestId,
    props.tutorialCurrentStepId,
    selectedPackId,
    setSelectedPackId,
  ]);
  return (
    <main className="hub-control-room-bg relative box-border flex h-[100dvh] w-full flex-col items-center justify-center overflow-hidden px-3 py-3 text-slate-100 sm:px-5">
      <section className="mx-auto flex h-full max-h-[95dvh] w-full max-w-screen-2xl min-w-0 flex-col overflow-hidden rounded-3xl border border-cyan-900/40 bg-[#020a14]/88 p-3 shadow-[0_24px_50px_rgba(2,5,14,0.86)] backdrop-blur-xl transition-all sm:p-4">
        <MarketHeaderBar
          walletBalance={state.catalog.wallet.nexus}
          nameQuery={state.nameQuery}
          typeFilter={state.typeFilter}
          orderField={state.orderField}
          orderDirection={state.orderDirection}
          onNameQueryChange={state.setNameQuery}
          onTypeFilterChange={state.setTypeFilter}
          onOrderFieldChange={state.setOrderField}
          onOrderDirectionToggle={() =>
            state.setOrderDirection((previous) => (previous === "ASC" ? "DESC" : "ASC"))
          }
          tutorialActions={props.tutorialActions}
          tutorialForceMobileFiltersOpen={props.tutorialActions ? tutorialForceMobileFiltersOpen : false}
        />

        {isDesktopLayout ? (
          <MarketDesktopGrid
            selectedCard={state.selectedCard}
            selectedListing={state.selectedListing}
            listings={state.visibleListings}
            packs={state.catalog.packs}
            selectedPackId={state.selectedPackId}
            collection={state.visibleCollection}
            transactions={state.transactions}
            catalogListings={state.catalog.listings}
            onBuyCard={handleBuyCard}
            onBuyPack={handleBuyPack}
            onSelectPack={handleSelectPack}
            onClearPackSelection={() => state.setSelectedPackId(null)}
            onSelectListing={handleSelectListing}
            onSelectVaultCard={handleSelectVaultCard}
            onTutorialBuyPack={props.tutorialActions?.onBuyPack}
            onVaultTabChange={(tab) =>
              tab === "COLLECTION"
                ? props.tutorialActions?.onOpenVaultCollection?.()
                : props.tutorialActions?.onOpenVaultHistory?.()
            }
          />
        ) : (
          <MarketMobileStack
            selectedCard={state.selectedCard}
            selectedListing={state.selectedListing}
            listings={state.mobileVisibleListings}
            packs={state.catalog.packs}
            selectedPackId={state.selectedPackId}
            collection={state.visibleCollection}
            transactions={state.transactions}
            catalogListings={state.catalog.listings}
            isBuyingPack={state.isBuyingPack}
            onBuyCard={handleBuyCard}
            onBuyPack={handleBuyPack}
            onSelectPack={handleSelectPack}
            onShowFreeListings={() => state.setSelectedPackId(null)}
            onSelectListing={handleSelectListing}
            onSelectVaultCard={handleSelectVaultCard}
            onTutorialBuyPack={props.tutorialActions?.onBuyPack}
            onVaultTabChange={(tab) =>
              tab === "COLLECTION"
                ? props.tutorialActions?.onOpenVaultCollection?.()
                : props.tutorialActions?.onOpenVaultHistory?.()
            }
            tutorialForcedPanel={props.tutorialActions ? tutorialForcedMobilePanel : null}
            tutorialForceInspectorOpen={props.tutorialActions ? tutorialForceInspectorOpen : false}
            tutorialCurrentStepId={props.tutorialActions ? props.tutorialCurrentStepId ?? null : null}
          />
        )}
      </section>

      <MarketPackRevealOverlay
        cards={state.revealedPackCards}
        isOpen={state.isPackRevealOpen}
        onClose={() => state.setIsPackRevealOpen(false)}
      />
      <HubErrorDialog
        title="Error de Mercado"
        message={state.errorMessage}
        onClose={() => state.setErrorMessage(null)}
      />
    </main>
  );
}
