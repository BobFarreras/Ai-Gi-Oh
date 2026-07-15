// src/components/hub/home/HomeDeckBuilderScene.tsx - Orquesta estado y acciones de Arsenal delegando render a la vista interna.
"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { ICard } from "@/core/entities/ICard";
import { HOME_DECK_SIZE } from "@/core/services/home/deck-rules";
import { ArsenalSection, ArsenalSectionSwitch } from "@/components/hub/home/objects/ArsenalSectionSwitch";
import { ArsenalObjectsView } from "@/components/hub/home/objects/ArsenalObjectsView";
import { ArsenalObjectApplyOverlay } from "@/components/hub/home/objects/ArsenalObjectApplyOverlay";
import { useArsenalObjects } from "@/components/hub/home/objects/use-arsenal-objects";
import { ISelectableObject } from "@/components/hub/home/objects/arsenal-objects-shared";
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
  // Flujo A: carta elegida primero (desde "Equipar objeto") → se elige el objeto en la sección Objetos.
  const [objectTargetCard, setObjectTargetCard] = useState<ICard | null>(null);
  // Flujo B: objeto elegido primero (desde la sección Objetos) → se elige la carta en la sección Cartas.
  const [pendingEquipObject, setPendingEquipObject] = useState<ISelectableObject | null>(null);

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

  // Tras aplicar una mejora, refleja el nuevo bonus en el arsenal (deck + almacén) sin recargar.
  const handleCardUpgraded = useCallback(
    (cardId: string, stat: "ATTACK" | "DEFENSE", value: number) => {
      state.setCardUpgradesById((previous) => {
        const next = new Map(previous);
        const current = next.get(cardId) ?? { attackBonus: 0, defenseBonus: 0 };
        next.set(cardId, {
          attackBonus: current.attackBonus + (stat === "ATTACK" ? value : 0),
          defenseBonus: current.defenseBonus + (stat === "DEFENSE" ? value : 0),
        });
        return next;
      });
    },
    [state],
  );

  const objectsRuntime = useArsenalObjects({
    cardProgressById: state.cardProgressById,
    cardUpgradesById: state.cardUpgradesById,
    onCardLeveled: handleCardLeveled,
    onCardUpgraded: handleCardUpgraded,
    onError: (message) => state.setErrorMessage(message),
  });

  const handleSectionChange = useCallback((next: ArsenalSection) => {
    // Cambiar de sección por el conmutador cancela cualquier equipado a medias.
    setObjectTargetCard(null);
    setPendingEquipObject(null);
    setSection(next);
  }, []);
  // Función de render (no un nodo): el buscador del arsenal aparece en varios sitios según el breakpoint y el
  // conmutador se pinta junto a él en cada uno.
  const renderSectionSwitch = useCallback(
    () => <ArsenalSectionSwitch section={section} onSectionChange={handleSectionChange} />,
    [handleSectionChange, section],
  );
  // Flujo A — "Equipar objeto" (detalle de carta): trae esa carta a la sección Objetos. Solo Entity.
  const handleEquipSelectedCard = useCallback(() => {
    const card = state.selectedCard;
    if (!card || card.type !== "ENTITY") return;
    setPendingEquipObject(null);
    setObjectTargetCard(card);
    setSection("OBJECTS");
  }, [state.selectedCard]);
  // Flujo B — "Equipar" en el detalle del objeto: guarda el objeto y va a Cartas a elegir carta.
  const handleEquipObject = useCallback((object: ISelectableObject) => {
    setObjectTargetCard(null);
    setPendingEquipObject(object);
    setSection("CARDS");
  }, []);
  // Flujo B — "Activar" en el detalle de la carta: aplica el objeto pendiente a la carta seleccionada.
  const handleActivatePendingObject = useCallback(() => {
    const card = state.selectedCard;
    if (!pendingEquipObject || !card || card.type !== "ENTITY") return;
    void objectsRuntime.apply(pendingEquipObject, card);
    setPendingEquipObject(null);
  }, [objectsRuntime, pendingEquipObject, state.selectedCard]);

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
    cardUpgradesById: state.cardUpgradesById,
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
    // Si hay objeto pendiente (flujo B) el botón del detalle es "Activar"; si no, "Equipar objeto" (flujo A).
    onEquipSelectedCard: pendingEquipObject ? handleActivatePendingObject : handleEquipSelectedCard,
    equipPendingObjectLabel: pendingEquipObject?.name ?? null,
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
  // La cinemática de aplicar objeto se pinta a nivel de Scene (fixed) para cubrir ambas secciones.
  const objectOverlay = objectsRuntime.overlay ? (
    <ArsenalObjectApplyOverlay result={objectsRuntime.overlay} onClose={objectsRuntime.closeOverlay} />
  ) : null;

  // El swap de sección va DESPUÉS de todos los hooks (reglas de hooks): en Objetos se cambia el workspace
  // entero por el panel de objetos, conservando el conmutador para volver.
  if (section === "OBJECTS") {
    return (
      <>
        <ArsenalObjectsView
          objects={objectsRuntime.objects}
          isLoading={objectsRuntime.items === null}
          targetCard={objectTargetCard}
          canApplyToTarget={(object) => (objectTargetCard ? objectsRuntime.canApply(object, objectTargetCard) : false)}
          sectionSwitch={renderSectionSwitch()}
          onApplyToTarget={(object) => { if (objectTargetCard) { void objectsRuntime.apply(object, objectTargetCard); setObjectTargetCard(null); } }}
          onEquipObject={handleEquipObject}
          onBackToHub={() => router.push("/hub")}
        />
        {objectOverlay}
      </>
    );
  }

  return (
    <>
      <HomeDeckBuilderSceneView {...viewProps} renderSectionSwitch={renderSectionSwitch} />
      {objectOverlay}
    </>
  );
}

