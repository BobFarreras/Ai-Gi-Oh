// src/components/hub/home/internal/dnd/handle-home-drop-on-fusion-slot.ts - Gestiona drop sobre slots del bloque de fusión.
import { DragEvent } from "react";
import { addCardToFusionDeckAction, removeCardFromFusionDeckAction } from "@/services/home/deck-builder/deck-builder-actions";
import { applyOptimisticAddToFusionSlot, applyOptimisticRemoveFromFusion } from "@/components/hub/home/internal/optimistic/optimistic-deck-updates";
import { IHomeDraggedCardState } from "@/components/hub/home/internal/types/home-deck-builder-types";
import { IHomeDropHandlerDeps } from "@/components/hub/home/internal/dnd/home-drop-handler-deps";

interface IHandleHomeDropOnFusionSlotInput extends IHomeDropHandlerDeps {
  slotIndex: number;
  event: DragEvent<HTMLElement>;
  draggedCard: IHomeDraggedCardState | null;
  setSelectedFusionSlotIndex: (slotIndex: number | null) => void;
  setSelectedCollectionCardId: (cardId: string | null) => void;
}

export async function handleHomeDropOnFusionSlot(input: IHandleHomeDropOnFusionSlotInput): Promise<void> {
  const {
    slotIndex,
    event,
    draggedCard,
    deck,
    collectionState,
    context,
    play,
    beginMutation,
    isLatestMutation,
    setDeck,
    setDraggedCard,
    setErrorMessage,
    setSelectedFusionSlotIndex,
    setSelectedCollectionCardId,
    resolveActionErrorMessage,
  } = input;
  event.preventDefault();
  if (!draggedCard) return;
  if (draggedCard.source === "DECK") {
    setErrorMessage("Una carta del Deck principal no se puede mover al Bloque Fusiones.");
    setDraggedCard(null);
    return;
  }
  if (draggedCard.source === "FUSION") {
    if (typeof draggedCard.slotIndex !== "number") {
      setDraggedCard(null);
      return;
    }
    const sourceIndex = draggedCard.slotIndex;
    if (sourceIndex === slotIndex) {
      setDraggedCard(null);
      return;
    }
    const sourceCardId = deck.fusionSlots[sourceIndex]?.cardId;
    const targetCardId = deck.fusionSlots[slotIndex]?.cardId;
    if (!sourceCardId) {
      setDraggedCard(null);
      return;
    }
    if (targetCardId !== null) {
      setErrorMessage("El slot de fusión de destino ya está ocupado.");
      setDraggedCard(null);
      return;
    }
    const previousDeck = deck;
    setDeck((currentDeck) => {
      const withoutSource = applyOptimisticRemoveFromFusion(currentDeck, sourceIndex);
      return applyOptimisticAddToFusionSlot(withoutSource, slotIndex, sourceCardId);
    });
    play("ADD_CARD");
    const mutationId = beginMutation();
    try {
      const deckAfterRemove = await removeCardFromFusionDeckAction(context, sourceIndex);
      const finalDeck = await addCardToFusionDeckAction({ ...context, deck: deckAfterRemove }, sourceCardId, slotIndex);
      if (isLatestMutation(mutationId)) setDeck(finalDeck);
      setSelectedFusionSlotIndex(slotIndex);
      setSelectedCollectionCardId(null);
      setErrorMessage(null);
    } catch (error) {
      if (isLatestMutation(mutationId)) setDeck(previousDeck);
      setErrorMessage(resolveActionErrorMessage(error, "No se pudo mover la carta al Bloque Fusiones."));
    } finally {
      setDraggedCard(null);
    }
    return;
  }
  const droppedCard = collectionState.find((entry) => entry.card.id === draggedCard.cardId)?.card;
  if (!droppedCard) {
    setDraggedCard(null);
    return;
  }
  if (droppedCard.type !== "FUSION") {
    setErrorMessage("Solo cartas de tipo FUSIÓN pueden entrar en Bloque Fusiones.");
    setDraggedCard(null);
    return;
  }
  const previousDeck = deck;
  if (previousDeck.fusionSlots[slotIndex]?.cardId !== null) {
    setErrorMessage("Ese slot de Bloque Fusiones ya está ocupado.");
    setDraggedCard(null);
    return;
  }
  setDeck((currentDeck) => applyOptimisticAddToFusionSlot(currentDeck, slotIndex, draggedCard.cardId));
  play("ADD_CARD");
  const mutationId = beginMutation();
  try {
    const updatedDeck = await addCardToFusionDeckAction(context, draggedCard.cardId, slotIndex);
    if (isLatestMutation(mutationId)) setDeck(updatedDeck);
    setSelectedCollectionCardId(draggedCard.cardId);
    setErrorMessage(null);
  } catch (error) {
    if (isLatestMutation(mutationId)) setDeck(previousDeck);
    setErrorMessage(resolveActionErrorMessage(error, "No se pudo colocar la carta en Bloque Fusiones."));
  } finally {
    setDraggedCard(null);
  }
}

