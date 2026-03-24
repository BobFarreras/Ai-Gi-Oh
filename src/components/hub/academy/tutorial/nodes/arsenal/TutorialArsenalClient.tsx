// src/components/hub/academy/tutorial/nodes/arsenal/TutorialArsenalClient.tsx - Ejecuta Preparar Deck con sandbox mock sobre UI real de Arsenal y flujo guiado seguro.
"use client";
import { useEffect, useMemo, useState } from "react";
import { HomeDeckActionBar } from "@/components/hub/home/HomeDeckActionBar";
import { HomeEvolutionOverlay } from "@/components/hub/home/HomeEvolutionOverlay";
import { HomeResponsiveWorkspace } from "@/components/hub/home/layout/HomeResponsiveWorkspace";
import { HubErrorDialog } from "@/components/hub/internal/HubErrorDialog";
import { useHubModuleSfx } from "@/components/hub/internal/use-hub-module-sfx";
import { useTutorialFlowController } from "@/components/tutorial/flow/useTutorialFlowController";
import { isMobileLayoutViewport } from "@/components/internal/layout-breakpoints";
import { IHomeDeckBuilderSceneProps } from "@/components/hub/home/internal/types/home-deck-builder-types";
import { useTutorialArsenalSandbox } from "@/components/hub/academy/tutorial/nodes/arsenal/internal/use-tutorial-arsenal-sandbox";
import { useTutorialArsenalProgressSync } from "@/components/hub/academy/tutorial/nodes/arsenal/internal/use-tutorial-arsenal-progress-sync";
import { TutorialArsenalFlowOverlays } from "@/components/hub/academy/tutorial/nodes/arsenal/internal/TutorialArsenalFlowOverlays";
import { resolveTutorialMobileSection } from "@/components/hub/academy/tutorial/nodes/arsenal/internal/resolve-tutorial-mobile-section";
import { ARSENAL_ACTION_LAYOUT_STEPS, ARSENAL_FUSION_LAYOUT_STEPS } from "@/components/hub/academy/tutorial/nodes/arsenal/internal/arsenal-tutorial-step-groups";
import { resolveStepIdMembership } from "@/components/hub/academy/tutorial/nodes/internal/resolve-step-id-membership";
import { ACADEMY_TUTORIAL_MAP_ROUTE } from "@/core/constants/routes/academy-routes";
import { resolveArsenalTutorialSteps } from "@/services/tutorial/arsenal/resolve-arsenal-tutorial-steps";

export function TutorialArsenalClient(props: IHomeDeckBuilderSceneProps) {
  const tutorial = useTutorialFlowController(useMemo(() => resolveArsenalTutorialSteps(), []));
  const sandbox = useTutorialArsenalSandbox({ ...props, tutorial });
  const { play } = useHubModuleSfx();
  const [isIntroVisible, setIsIntroVisible] = useState(true);
  const [isMobileLayout, setIsMobileLayout] = useState<boolean>(() =>
    typeof window === "undefined" ? false : isMobileLayoutViewport(window.innerWidth),
  );
  const evolutionCard = sandbox.state.selectedCard ?? null;
  const tutorialForcedMobileSection = useMemo(
    () => (isIntroVisible || tutorial.isFinished ? null : resolveTutorialMobileSection(tutorial.currentStep)),
    [isIntroVisible, tutorial.currentStep, tutorial.isFinished],
  );
  useEffect(() => {
    const updateLayoutMode = (): void => setIsMobileLayout(isMobileLayoutViewport(window.innerWidth));
    updateLayoutMode();
    window.addEventListener("resize", updateLayoutMode);
    return () => window.removeEventListener("resize", updateLayoutMode);
  }, []);
  const currentStepId = tutorial.currentStep?.id ?? null;
  const isFusionStep = resolveStepIdMembership(currentStepId, ARSENAL_FUSION_LAYOUT_STEPS);
  const isActionStep = resolveStepIdMembership(currentStepId, ARSENAL_ACTION_LAYOUT_STEPS);
  const shouldPreferTopTutorialDialog = isFusionStep || (isMobileLayout && isActionStep);
  useTutorialArsenalProgressSync({
    selectedSlotIndex: sandbox.state.selectedSlotIndex,
    selectedCollectionCardId: sandbox.state.selectedCollectionCardId,
    canEvolveSelectedCard: sandbox.state.canEvolveSelectedCard,
    tutorial,
  });

  return (
    <>
      <main className="hub-control-room-bg relative box-border h-[100dvh] w-full overflow-hidden px-3 py-3 text-slate-100 sm:px-5">
        <section className="mx-auto flex h-full max-h-[95dvh] w-full max-w-screen-2xl min-w-0 flex-col overflow-hidden rounded-3xl border border-cyan-900/40 bg-[#020a14]/88 p-3 shadow-[0_24px_50px_rgba(2,5,14,0.86)] backdrop-blur-xl sm:p-4">
          <HomeDeckActionBar
            deckCount={sandbox.state.deckCardCount}
            deckSize={20}
            canInsert={sandbox.state.canInsertSelectedCard}
            canRemove={sandbox.state.selectedSlotHasCard || sandbox.state.selectedFusionSlotHasCard}
            typeFilter={sandbox.state.typeFilter}
            orderField={sandbox.state.orderField}
            orderDirection={sandbox.state.orderDirection}
            nameQuery={sandbox.state.nameQuery}
            onNameQueryChange={sandbox.state.setNameQuery}
            onChangeTypeFilter={sandbox.state.setTypeFilter}
            onChangeOrderField={sandbox.state.setOrderField}
            onToggleOrderDirection={() => sandbox.state.setOrderDirection((previous) => (previous === "ASC" ? "DESC" : "ASC"))}
            onInsert={sandbox.insertSelectedCard}
            onRemove={sandbox.removeSelectedCard}
            canEvolve={sandbox.state.canEvolveSelectedCard}
            evolveCost={sandbox.state.copiesRequiredToEvolve}
            onEvolve={sandbox.evolveSelectedCard}
            onBackToHub={() => window.location.assign(ACADEMY_TUTORIAL_MAP_ROUTE)}
          />
          <HomeResponsiveWorkspace
            deck={sandbox.state.deck}
            collectionState={sandbox.state.collectionState}
            filteredCollection={sandbox.state.filteredCollection}
            cardProgressById={sandbox.state.cardProgressById}
            evolvableCardIds={sandbox.state.evolvableCardIds}
            selectedSlotIndex={sandbox.state.selectedSlotIndex}
            selectedFusionSlotIndex={sandbox.state.selectedFusionSlotIndex}
            selectedCardId={sandbox.state.selectedCardId}
            selectedCollectionCardId={sandbox.state.selectedCollectionCardId}
            selectedCard={sandbox.state.selectedCard}
            selectedCardVersionTier={sandbox.state.selectedCardVersionTier}
            selectedCardLevel={sandbox.state.selectedCardLevel}
            selectedCardXp={sandbox.state.selectedCardXp}
            selectedCardMasteryPassiveSkillId={sandbox.state.selectedCardMasteryPassiveSkillId}
            nameQuery={sandbox.state.nameQuery}
            typeFilter={sandbox.state.typeFilter}
            canInsertSelectedCard={sandbox.state.canInsertSelectedCard}
            canRemoveSelectedCard={sandbox.state.selectedSlotHasCard || sandbox.state.selectedFusionSlotHasCard}
            canEvolveSelectedCard={sandbox.state.canEvolveSelectedCard}
            evolveCostForSelectedCard={sandbox.state.copiesRequiredToEvolve}
            onInsertSelectedCard={sandbox.insertSelectedCard}
            onRemoveSelectedCard={sandbox.removeSelectedCard}
            onEvolveSelectedCard={sandbox.evolveSelectedCard}
            onSelectSlot={(slotIndex) => {
              play("DETAIL_OPEN");
              sandbox.state.setSelectedSlotIndex(slotIndex);
              sandbox.state.setSelectedFusionSlotIndex(null);
              sandbox.state.setSelectedCollectionCardId(null);
            }}
            onSelectFusionSlot={(slotIndex) => {
              play("DETAIL_OPEN");
              sandbox.state.setSelectedFusionSlotIndex(slotIndex);
              sandbox.state.setSelectedSlotIndex(null);
              sandbox.state.setSelectedCollectionCardId(null);
            }}
            onSelectCollectionCard={(cardId) => {
              play("DETAIL_OPEN");
              sandbox.state.setSelectedCollectionCardId(cardId);
              sandbox.state.setSelectedSlotIndex(null);
              sandbox.state.setSelectedFusionSlotIndex(null);
            }}
            onStartDragCollectionCard={() => {}}
            onStartDragDeckSlot={() => {}}
            onStartDragFusionSlot={() => {}}
            onDropOnDeckSlot={() => {}}
            onDropOnFusionSlot={() => {}}
            onDropOnCollectionArea={() => {}}
            onClearError={() => sandbox.state.setErrorMessage(null)}
            tutorialForcedMobileSection={tutorialForcedMobileSection}
            tutorialCurrentStepId={tutorial.currentStep?.id ?? null}
          />
        </section>
        {sandbox.state.evolutionOverlay ? (
          <HomeEvolutionOverlay
            card={evolutionCard}
            fromVersionTier={sandbox.state.evolutionOverlay.fromVersionTier}
            toVersionTier={sandbox.state.evolutionOverlay.toVersionTier}
            level={sandbox.state.evolutionOverlay.level}
            consumedCopies={sandbox.state.evolutionOverlay.consumedCopies}
          />
        ) : null}
        <HubErrorDialog title="Error de Tutorial" message={sandbox.state.errorMessage} onClose={() => sandbox.state.setErrorMessage(null)} />
      </main>
      <TutorialArsenalFlowOverlays
        isIntroVisible={isIntroVisible}
        setIsIntroVisible={setIsIntroVisible}
        tutorial={tutorial}
        shouldPreferTopTutorialDialog={shouldPreferTopTutorialDialog}
        isEvolutionOverlayVisible={Boolean(sandbox.state.evolutionOverlay)}
        playSfx={play}
      />
    </>
  );
}
