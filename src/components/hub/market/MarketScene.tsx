// src/components/hub/market/MarketScene.tsx - Orquesta la UI del mercado usando paneles modulares y estado desacoplado.
"use client";

import { MarketHeaderBar } from "@/components/hub/market/layout/MarketHeaderBar";
import { MarketDesktopGrid } from "@/components/hub/market/layout/MarketDesktopGrid";
import { MarketMobileStack } from "@/components/hub/market/layout/MarketMobileStack";
import { MarketPackRevealOverlay } from "@/components/hub/market/reveal/MarketPackRevealOverlay";
import { HubErrorDialog } from "@/components/hub/internal/HubErrorDialog";
import { useViewportWidth } from "@/components/hub/internal/use-viewport-width";
import { useMarketSceneState } from "@/components/hub/market/internal/useMarketSceneState";
import { ICollectionCard } from "@/core/entities/home/ICollectionCard";
import { IMarketTransaction } from "@/core/entities/market/IMarketTransaction";
import { IMarketCatalog } from "@/core/use-cases/market/GetMarketCatalogUseCase";
import { isDesktopLayoutViewport } from "@/components/internal/layout-breakpoints";
import { IMarketPurchaseActionOverrides, IMarketTutorialActions } from "@/components/hub/market/internal/market-tutorial-contract";
import { useMarketSceneTutorialFlow } from "@/components/hub/market/internal/use-market-scene-tutorial-flow";

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
  const state = useMarketSceneState({
    playerId: props.playerId,
    initialCatalog: props.initialCatalog,
    initialTransactions: props.initialTransactions,
    initialCollection: props.initialCollection,
    purchaseActionOverrides: props.purchaseActionOverrides,
  });
  const viewportWidth = useViewportWidth();
  const isDesktopLayout = isDesktopLayoutViewport(viewportWidth);
  const {
    tutorialForcedMobilePanel,
    tutorialForceInspectorOpen,
    tutorialForceMobileFiltersOpen,
    handleSelectListing,
    handleSelectVaultCard,
    handleBuyCard,
    handleSelectPack,
  } = useMarketSceneTutorialFlow({
    state,
    tutorialActions: props.tutorialActions,
    tutorialCurrentStepId: props.tutorialCurrentStepId,
    tutorialAutoBuyPackRequestId: props.tutorialAutoBuyPackRequestId,
    purchaseActionOverrides: props.purchaseActionOverrides,
  });
  const handleBuyPack = state.handleBuyPack;
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
