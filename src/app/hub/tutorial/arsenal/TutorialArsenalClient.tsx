// src/app/hub/tutorial/arsenal/TutorialArsenalClient.tsx - Ejecuta Preparar Deck con sandbox mock sobre UI real de Arsenal y flujo guiado seguro.
"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { HomeDeckActionBar } from "@/components/hub/home/HomeDeckActionBar";
import { HomeEvolutionOverlay } from "@/components/hub/home/HomeEvolutionOverlay";
import { HomeResponsiveWorkspace } from "@/components/hub/home/layout/HomeResponsiveWorkspace";
import { HubErrorDialog } from "@/components/hub/internal/HubErrorDialog";
import { TutorialBigLogDialog } from "@/components/tutorial/flow/TutorialBigLogDialog";
import { TutorialBigLogIntroOverlay } from "@/components/tutorial/flow/TutorialBigLogIntroOverlay";
import { TutorialInteractionGuard } from "@/components/tutorial/flow/TutorialInteractionGuard";
import { TutorialSpotlightOverlay } from "@/components/tutorial/flow/TutorialSpotlightOverlay";
import { useTutorialFlowController } from "@/components/tutorial/flow/useTutorialFlowController";
import { IHomeDeckBuilderSceneProps } from "@/components/hub/home/internal/types/home-deck-builder-types";
import { postTutorialNodeCompletion } from "@/app/hub/tutorial/internal/tutorial-node-progress-client";
import { useTutorialArsenalSandbox } from "@/app/hub/tutorial/arsenal/internal/use-tutorial-arsenal-sandbox";
import { resolveArsenalTutorialSteps } from "@/services/tutorial/arsenal/resolve-arsenal-tutorial-steps";

export function TutorialArsenalClient(props: IHomeDeckBuilderSceneProps) {
  const tutorial = useTutorialFlowController(useMemo(() => resolveArsenalTutorialSteps(), []));
  const sandbox = useTutorialArsenalSandbox({ ...props, tutorial });
  const [isIntroVisible, setIsIntroVisible] = useState(true);
  const hasSyncedCompletionRef = useRef(false);
  const evolutionCard = sandbox.state.selectedCard ?? null;

  useEffect(() => {
    if (tutorial.currentStep?.id === "arsenal-select-deck-card" && sandbox.state.selectedSlotIndex !== null) tutorial.onAction("SELECT_DECK_CARD");
    if (tutorial.currentStep?.id === "arsenal-select-collection-card" && sandbox.state.selectedCollectionCardId) tutorial.onAction("SELECT_COLLECTION_CARD");
  }, [sandbox.state.selectedCollectionCardId, sandbox.state.selectedSlotIndex, tutorial]);

  useEffect(() => {
    if (!tutorial.isFinished || hasSyncedCompletionRef.current) return;
    hasSyncedCompletionRef.current = true;
    postTutorialNodeCompletion("tutorial-arsenal-basics").catch(() => {
      hasSyncedCompletionRef.current = false;
    });
  }, [tutorial.isFinished]);

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
            onBackToHub={() => window.location.assign("/hub/tutorial")}
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
            onSelectSlot={(slotIndex) => { sandbox.state.setSelectedSlotIndex(slotIndex); sandbox.state.setSelectedFusionSlotIndex(null); sandbox.state.setSelectedCollectionCardId(null); }}
            onSelectFusionSlot={(slotIndex) => { sandbox.state.setSelectedFusionSlotIndex(slotIndex); sandbox.state.setSelectedSlotIndex(null); sandbox.state.setSelectedCollectionCardId(null); }}
            onSelectCollectionCard={(cardId) => { sandbox.state.setSelectedCollectionCardId(cardId); sandbox.state.setSelectedSlotIndex(null); sandbox.state.setSelectedFusionSlotIndex(null); }}
            onStartDragCollectionCard={() => {}}
            onStartDragDeckSlot={() => {}}
            onStartDragFusionSlot={() => {}}
            onDropOnDeckSlot={() => {}}
            onDropOnFusionSlot={() => {}}
            onDropOnCollectionArea={() => {}}
            onClearError={() => sandbox.state.setErrorMessage(null)}
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
      <TutorialInteractionGuard isEnabled={isIntroVisible || !tutorial.isFinished} allowedTargetIds={isIntroVisible ? [] : tutorial.allowedTargetIds} />
      <TutorialSpotlightOverlay isVisible={!isIntroVisible && !tutorial.isFinished} targetId={tutorial.currentStep?.targetId ?? null} />
      <TutorialBigLogIntroOverlay
        isVisible={isIntroVisible}
        title="Preparar Deck"
        description="Practicarás con un mazo sandbox: remover para abrir hueco, añadir cartas, revisar detalle, entender fusión y evolucionar en almacén."
        onStart={() => setIsIntroVisible(false)}
      />
      {!isIntroVisible ? (
        <TutorialBigLogDialog
          title={tutorial.currentStep?.title ?? "Nodo completado"}
          description={tutorial.currentStep?.description ?? "Has completado Preparar Deck. Vuelve al mapa para continuar."}
          canUseNext={tutorial.canUseNext}
          isFinished={tutorial.isFinished}
          onNext={tutorial.onNext}
        />
      ) : null}
    </>
  );
}
