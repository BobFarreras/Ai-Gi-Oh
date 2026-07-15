// src/components/hub/home/HomeDeckBuilderScene.tsx - Orquesta estado y acciones de Arsenal delegando render a la vista interna.
"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { ICard } from "@/core/entities/ICard";
import { HOME_DECK_SIZE } from "@/core/services/home/deck-rules";
import { ArsenalSection, ArsenalSectionSwitch } from "@/components/hub/home/objects/ArsenalSectionSwitch";
import { ArsenalObjectsView } from "@/components/hub/home/objects/ArsenalObjectsView";
import { countRender } from "@/services/performance/dev-performance-telemetry";
import { resolveHomeActionErrorMessage } from "@/components/hub/home/internal/errors/home-action-error-message";
import { useDeckMutationQueue } from "@/components/hub/home/internal/hooks/use-deck-mutation-queue";
import { useHubModuleSfx } from "@/components/hub/internal/use-hub-module-sfx";
import { IHomeDeckBuilderSceneProps } from "@/components/hub/home/internal/types/home-deck-builder-types";
import { useHomeWorkspaceHandlers } from "@/components/hub/home/internal/hooks/use-home-workspace-handlers";
import { HomeDeckBuilderSceneView } from "@/components/hub/home/internal/view/HomeDeckBuilderSceneView";
import { createHomeDeckBuilderViewProps } from "@/components/hub/home/internal/view/create-home-deck-builder-view-props";
import { useHomeDeckBuilderState } from "@/components/hub/home/internal/hooks/use-home-deck-builder-state";
import { useHomeDeckBuilderActions } from "@/components/hub/home/internal/hooks/use-home-deck-builder-actions";
import { useHomeExitGuard } from "@/components/hub/home/internal/hooks/use-home-exit-guard";

export function HomeDeckBuilderScene(props: IHomeDeckBuilderSceneProps) {
  countRender("HomeDeckBuilderScene");
  const router = useRouter();
  const { play } = useHubModuleSfx();
  const { enqueueDeckMutation } = useDeckMutationQueue();
  const state = useHomeDeckBuilderState(props);
  const [section, setSection] = useState<ArsenalSection>("CARDS");
  // Carta a la que se equipará un objeto: la fija "Equipar objeto" del detalle y viaja a la sección Objetos.
  const [objectTargetCard, setObjectTargetCard] = useState<ICard | null>(null);
  const handleSectionChange = useCallback((next: ArsenalSection) => {
    // Volver a Cartas por el conmutador limpia el objetivo (dejar de "equipar").
    if (next === "CARDS") setObjectTargetCard(null);
    setSection(next);
  }, []);
  // Función de render (no un nodo): el buscador del arsenal aparece en varios sitios según el breakpoint y el
  // conmutador se pinta junto a él en cada uno.
  const renderSectionSwitch = useCallback(
    () => <ArsenalSectionSwitch section={section} onSectionChange={handleSectionChange} />,
    [handleSectionChange, section],
  );
  // "Equipar objeto" (detalle de carta): trae esa carta a la sección Objetos. Solo Entity: son las que suben
  // atributos con nivel/mejoras.
  const handleEquipSelectedCard = useCallback(() => {
    const card = state.selectedCard;
    if (!card || card.type !== "ENTITY") return;
    setObjectTargetCard(card);
    setSection("OBJECTS");
  }, [state.selectedCard]);

  // Tras usar un caramelo, refleja el nuevo nivel/xp de la carta en el estado del arsenal (sin recargar): la
  // progresión es la MISMA fuente que usa el deck-builder para mostrar stats, así que la carta sube al volver.
  const handleCardLeveled = useCallback(
    (cardId: string, level: number, xp: number) => {
      state.setCardProgressById((previous) => {
        const next = new Map(previous);
        const existing = next.get(cardId);
        next.set(cardId, {
          playerId: props.playerId,
          cardId,
          versionTier: existing?.versionTier ?? 0,
          masteryPassiveSkillId: existing?.masteryPassiveSkillId ?? null,
          updatedAtIso: new Date().toISOString(),
          level,
          xp,
        });
        return next;
      });
    },
    [props.playerId, state],
  );

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
    enqueueDeckMutation,
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
    enqueueDeckMutation,
    setDeck: state.setDeck,
    setDraggedCard: state.setDraggedCard,
    setErrorMessage: state.setErrorMessage,
    setSelectedSlotIndex: state.setSelectedSlotIndex,
    setSelectedFusionSlotIndex: state.setSelectedFusionSlotIndex,
    setSelectedCollectionCardId: state.setSelectedCollectionCardId,
    resolveActionErrorMessage: resolveHomeActionErrorMessage,
  });
  const exitGuard = useHomeExitGuard({
    deckCardCount: state.deckCardCount,
    deckSize: HOME_DECK_SIZE,
    onNavigate: (href) => router.push(href),
    play,
  });
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
    onCloseEvolutionOverlay: () => state.setEvolutionOverlay(null),
    onNameQueryChange: state.setNameQuery,
    onChangeTypeFilter: state.setTypeFilter,
    onChangeOrderField: state.setOrderField,
    onToggleOrderDirection: () =>
      state.setOrderDirection((previousDirection) => (previousDirection === "ASC" ? "DESC" : "ASC")),
    onInsertSelectedCard: actions.handleInsertSelectedCard,
    onRemoveSelectedCard: actions.handleRemoveSelectedCard,
    onEvolveSelectedCard: actions.handleEvolveSelectedCard,
    onEquipSelectedCard: handleEquipSelectedCard,
    onBackToHub: exitGuard.handleBackToHubRequest,
    onClearError: () => state.setErrorMessage(null),
    isExitDialogOpen: exitGuard.isExitDialogOpen,
    onCloseExitDialog: exitGuard.closeExitDialog,
    onConfirmExitToHub: exitGuard.confirmExitToHub,
    onGoToMarket: exitGuard.goToMarket,
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
  // El swap de sección va DESPUÉS de todos los hooks (reglas de hooks): en Objetos se cambia el workspace
  // entero por el panel de objetos, conservando el conmutador para volver.
  if (section === "OBJECTS") {
    return (
      <ArsenalObjectsView
        targetCard={objectTargetCard}
        cardProgressById={state.cardProgressById}
        sectionSwitch={renderSectionSwitch()}
        onCardLeveled={handleCardLeveled}
        onBackToHub={() => router.push("/hub")}
      />
    );
  }

  return <HomeDeckBuilderSceneView {...viewProps} renderSectionSwitch={renderSectionSwitch} />;
}

