// src/components/hub/home/HomeDeckBuilderScene.tsx - Orquesta estado y acciones de Arsenal delegando render a la vista interna.
"use client";

import { useRouter } from "next/navigation";
import { HOME_DECK_SIZE } from "@/core/services/home/deck-rules";
import { countRender } from "@/services/performance/dev-performance-telemetry";
import { resolveHomeActionErrorMessage } from "@/components/hub/home/internal/errors/home-action-error-message";
import { useDeckMutationGuard } from "@/components/hub/home/internal/hooks/use-deck-mutation-guard";
import { useHubModuleSfx } from "@/components/hub/internal/use-hub-module-sfx";
import { IHomeDeckBuilderSceneProps } from "@/components/hub/home/internal/types/home-deck-builder-types";
import { useHomeWorkspaceHandlers } from "@/components/hub/home/internal/hooks/use-home-workspace-handlers";
import { HomeDeckBuilderSceneView } from "@/components/hub/home/internal/view/HomeDeckBuilderSceneView";
import { createHomeDeckBuilderViewProps } from "@/components/hub/home/internal/view/create-home-deck-builder-view-props";
import { useHomeDeckBuilderState } from "@/components/hub/home/internal/hooks/use-home-deck-builder-state";
import { useHomeDeckBuilderActions } from "@/components/hub/home/internal/hooks/use-home-deck-builder-actions";

export function HomeDeckBuilderScene(props: IHomeDeckBuilderSceneProps) {
  countRender("HomeDeckBuilderScene");
  const router = useRouter();
  const { play } = useHubModuleSfx();
  const { beginMutation, isLatestMutation } = useDeckMutationGuard();
  const state = useHomeDeckBuilderState(props);
  const actionDeps = {
    context: state.context,
    deck: state.deck,
    collectionState: state.collectionState,
    cardProgressById: state.cardProgressById,
    setDeck: state.setDeck,
    setCollectionState: state.setCollectionState,
    setCardProgressById: state.setCardProgressById,
    setErrorMessage: state.setErrorMessage,
    setEvolutionOverlay: state.setEvolutionOverlay,
    beginMutation,
    isLatestMutation,
    resolveActionErrorMessage: resolveHomeActionErrorMessage,
    play,
  };
  const actions = useHomeDeckBuilderActions({
    ...actionDeps,
    selectedCollectionCardId: state.selectedCollectionCardId,
    selectedCollectionCardType: state.selectedCollectionCardType,
    targetFusionSlotIndex: state.targetFusionSlotIndex,
    selectedSlotIndex: state.selectedSlotIndex,
    selectedFusionSlotIndex: state.selectedFusionSlotIndex,
    selectedCardId: state.selectedCardId,
    canEvolveSelectedCard: state.canEvolveSelectedCard,
    copiesRequiredToEvolve: state.copiesRequiredToEvolve,
    selectedCardVersionTier: state.selectedCardVersionTier,
    selectedCardLevel: state.selectedCardLevel,
    selectedCardProgress: state.selectedCardProgress,
  });
  const workspaceHandlers = useHomeWorkspaceHandlers({
    deck: state.deck,
    collectionState: state.collectionState,
    context: state.context,
    draggedCard: state.draggedCard,
    selectedSlotIndex: state.selectedSlotIndex,
    selectedFusionSlotIndex: state.selectedFusionSlotIndex,
    selectedCollectionCardId: state.selectedCollectionCardId,
    play,
    beginMutation,
    isLatestMutation,
    setDeck: state.setDeck,
    setDraggedCard: state.setDraggedCard,
    setErrorMessage: state.setErrorMessage,
    setSelectedSlotIndex: state.setSelectedSlotIndex,
    setSelectedFusionSlotIndex: state.setSelectedFusionSlotIndex,
    setSelectedCollectionCardId: state.setSelectedCollectionCardId,
    resolveActionErrorMessage: resolveHomeActionErrorMessage,
  });
  const handleBackToHub = () => {
    if (state.deckCardCount < HOME_DECK_SIZE) {
      play("ERROR_COMMON");
      state.setErrorMessage(`Deck incompleto (${state.deckCardCount}/${HOME_DECK_SIZE}). Completa 20 cartas antes de salir de Arsenal.`);
      return;
    }
    router.push("/hub");
  };
  const viewProps = createHomeDeckBuilderViewProps({
    deck: state.deck,
    collectionState: state.collectionState,
    filteredCollection: state.filteredCollection,
    cardProgressById: state.cardProgressById,
    evolvableCardIds: state.evolvableCardIds,
    selectedSlotIndex: state.selectedSlotIndex,
    selectedFusionSlotIndex: state.selectedFusionSlotIndex,
    selectedCardId: state.selectedCardId,
    selectedCollectionCardId: state.selectedCollectionCardId,
    selectedCard: state.selectedCard,
    selectedCardVersionTier: state.selectedCardVersionTier,
    selectedCardLevel: state.selectedCardLevel,
    selectedCardXp: state.selectedCardXp,
    selectedCardMasteryPassiveSkillId: state.selectedCardMasteryPassiveSkillId,
    nameQuery: state.nameQuery,
    typeFilter: state.typeFilter,
    orderField: state.orderField,
    orderDirection: state.orderDirection,
    canInsertSelectedCard: state.canInsertSelectedCard,
    canRemoveSelectedCard: state.selectedSlotHasCard || state.selectedFusionSlotHasCard,
    canEvolveSelectedCard: state.canEvolveSelectedCard,
    copiesRequiredToEvolve: state.copiesRequiredToEvolve,
    deckCardCount: state.deckCardCount,
    deckSize: HOME_DECK_SIZE,
    errorMessage: state.errorMessage,
    evolutionOverlay: state.evolutionOverlay,
    evolutionCard: state.evolutionCard,
    onNameQueryChange: state.setNameQuery,
    onChangeTypeFilter: state.setTypeFilter,
    onChangeOrderField: state.setOrderField,
    onToggleOrderDirection: () =>
      state.setOrderDirection((previousDirection) => (previousDirection === "ASC" ? "DESC" : "ASC")),
    onInsertSelectedCard: actions.handleInsertSelectedCard,
    onRemoveSelectedCard: actions.handleRemoveSelectedCard,
    onEvolveSelectedCard: actions.handleEvolveSelectedCard,
    onBackToHub: handleBackToHub,
    onClearError: () => state.setErrorMessage(null),
    onSelectSlot: workspaceHandlers.onSelectSlot,
    onSelectFusionSlot: workspaceHandlers.onSelectFusionSlot,
    onSelectCollectionCard: workspaceHandlers.onSelectCollectionCard,
    onStartDragCollectionCard: workspaceHandlers.onStartDragCollectionCard,
    onStartDragDeckSlot: workspaceHandlers.onStartDragDeckSlot,
    onStartDragFusionSlot: workspaceHandlers.onStartDragFusionSlot,
    onDropOnDeckSlot: (slotIndex, event) => {
      void workspaceHandlers.onDropOnDeckSlot(slotIndex, event);
    },
    onDropOnFusionSlot: (slotIndex, event) => {
      void workspaceHandlers.onDropOnFusionSlot(slotIndex, event);
    },
    onDropOnCollectionArea: (event) => {
      void workspaceHandlers.onDropOnCollectionArea(event);
    },
  });
  return <HomeDeckBuilderSceneView {...viewProps} />;
}

