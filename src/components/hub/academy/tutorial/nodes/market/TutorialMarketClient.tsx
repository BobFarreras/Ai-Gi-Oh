// src/components/hub/academy/tutorial/nodes/market/TutorialMarketClient.tsx - Ejecuta nodo Market tutorial sobre la UI real del Market con datos mock controlados.
"use client";
import { useMemo, useState } from "react";
import { MarketScene } from "@/components/hub/market/MarketScene";
import { TutorialBigLogDialog } from "@/components/tutorial/flow/TutorialBigLogDialog";
import { TutorialBigLogIntroOverlay } from "@/components/tutorial/flow/TutorialBigLogIntroOverlay";
import { TutorialBigLogOutroOverlay } from "@/components/tutorial/flow/TutorialBigLogOutroOverlay";
import { TutorialInteractionGuard } from "@/components/tutorial/flow/TutorialInteractionGuard";
import { TutorialSpotlightOverlay } from "@/components/tutorial/flow/TutorialSpotlightOverlay";
import { useTutorialFlowController } from "@/components/tutorial/flow/useTutorialFlowController";
import { useHubModuleSfx } from "@/components/hub/internal/use-hub-module-sfx";
import { useViewportWidth } from "@/components/hub/internal/use-viewport-width";
import { isMobileLayoutViewport } from "@/components/internal/layout-breakpoints";
import { ACADEMY_TRAINING_TUTORIAL_ROUTE, ACADEMY_TUTORIAL_MAP_ROUTE } from "@/core/constants/routes/academy-routes";
import { resolveStepIdMembership } from "@/components/hub/academy/tutorial/nodes/internal/resolve-step-id-membership";
import { useTutorialNodeCompletionSync } from "@/components/hub/academy/tutorial/nodes/internal/use-tutorial-node-completion-sync";
import { MARKET_FILTER_GUIDE_STEPS, MARKET_NEXT_BUTTON_HIGHLIGHT_STEPS, MARKET_PINNED_TOP_STEPS } from "@/components/hub/academy/tutorial/nodes/market/internal/market-tutorial-step-groups";
import { useTutorialMarketRuntime } from "@/components/hub/academy/tutorial/nodes/market/internal/use-tutorial-market-runtime";
import { resolveMarketTutorialSteps } from "@/services/tutorial/market/resolve-market-tutorial-steps";

export function TutorialMarketClient() {
  const viewportWidth = useViewportWidth();
  const isMobileLayout = isMobileLayoutViewport(viewportWidth);
  const tutorial = useTutorialFlowController(
    useMemo(() => resolveMarketTutorialSteps({ isMobileLayout }), [isMobileLayout]),
  );
  const runtime = useTutorialMarketRuntime();
  const { play } = useHubModuleSfx();
  const [isIntroVisible, setIsIntroVisible] = useState(true);
  const [isPackRevealOpen, setIsPackRevealOpen] = useState(false);
  const [autoBuyPackRequestId, setAutoBuyPackRequestId] = useState(0);
  const currentStepId = tutorial.currentStep?.id ?? null;
  // Reglas de UI declarativas por grupo para evitar condicionales duplicadas en cliente.
  const isPinnedTopStep = resolveStepIdMembership(currentStepId, MARKET_PINNED_TOP_STEPS);
  const isFilterGuideStep = resolveStepIdMembership(currentStepId, MARKET_FILTER_GUIDE_STEPS);
  const shouldHighlightNextButton = isFilterGuideStep || resolveStepIdMembership(currentStepId, MARKET_NEXT_BUTTON_HIGHLIGHT_STEPS);

  useTutorialNodeCompletionSync({ tutorial, nodeId: "tutorial-market-basics" });

  return (
    <>
      <TutorialInteractionGuard
        isEnabled={isIntroVisible || !tutorial.isFinished}
        allowedTargetIds={isIntroVisible ? [] : tutorial.allowedTargetIds}
      />
      <TutorialSpotlightOverlay
        isVisible={!isIntroVisible && !tutorial.isFinished}
        targetId={tutorial.currentStep?.targetId ?? null}
        disableAutoScroll={isPinnedTopStep}
      />
      <TutorialBigLogIntroOverlay
        isVisible={isIntroVisible}
        title="Market"
        description="Aprenderás a filtrar el catálogo, comprar cartas sueltas, abrir packs y revisar tu historial de compras."
        onStart={() => setIsIntroVisible(false)}
      />
      <MarketScene
        playerId="tutorial-player"
        initialCatalog={runtime.initialCatalog}
        initialTransactions={runtime.initialTransactions}
        initialCollection={runtime.initialCollection}
        purchaseActionOverrides={runtime.purchaseActionOverrides}
        tutorialCurrentStepId={currentStepId}
        tutorialAutoBuyPackRequestId={autoBuyPackRequestId}
        tutorialActions={{
          onOpenMobileFilters: () => tutorial.onAction("OPEN_MOBILE_FILTERS"),
          onTypeFilterChange: () => tutorial.onAction("CHANGE_TYPE_FILTER"),
          onOrderFieldChange: () => tutorial.onAction("CHANGE_ORDER_FILTER"),
          onOrderDirectionToggle: () => tutorial.onAction("TOGGLE_ORDER_DIRECTION"),
          onBuyCard: () => tutorial.onAction("BUY_CARD"),
          onBuyPack: () => tutorial.onAction("BUY_PACK"),
          onOpenVaultCollection: () => tutorial.onAction("OPEN_VAULT_COLLECTION"),
          onOpenVaultHistory: () => tutorial.onAction("OPEN_HISTORY"),
          onSelectPack: (packId) => {
            if (!packId) return;
            if (packId === "tutorial-market-pack-gemgpt") tutorial.onAction("SELECT_GEMGPT_PACK");
          },
          onPackRevealOpen: () => setIsPackRevealOpen(true),
          onPackRevealClose: () => setIsPackRevealOpen(false),
        }}
      />
      {!isIntroVisible && !tutorial.isFinished && !isPackRevealOpen ? (
        <TutorialBigLogDialog
          title={tutorial.currentStep?.title ?? "Práctica completada"}
          description={
            tutorial.currentStep?.description ??
            "Has completado el flujo base de Market. Ya puedes volver al mapa del tutorial para continuar."
          }
          canUseNext={tutorial.canUseNext}
          isFinished={tutorial.isFinished}
          onNext={() => {
            play("SECTION_SWITCH");
            if (currentStepId === "market-buy-pack") {
              setAutoBuyPackRequestId((previous) => previous + 1);
              return;
            }
            tutorial.onNext();
          }}
          targetId={tutorial.currentStep?.targetId ?? null}
          preferTopPlacement={isPinnedTopStep}
          disableAutoScrollWhenPinnedTop={isPinnedTopStep}
          shouldHighlightNextButton={shouldHighlightNextButton && tutorial.canUseNext}
        />
      ) : null}
      <TutorialBigLogOutroOverlay
        isVisible={!isIntroVisible && tutorial.isFinished}
        title="Market Completado"
        description="Has dominado compras directas, packs aleatorios y auditoría del historial."
        onContinue={() => window.location.assign(ACADEMY_TRAINING_TUTORIAL_ROUTE)}
        onExit={() => window.location.assign(ACADEMY_TUTORIAL_MAP_ROUTE)}
      />
    </>
  );
}
