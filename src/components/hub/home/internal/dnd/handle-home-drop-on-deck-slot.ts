// src/components/hub/home/internal/dnd/handle-home-drop-on-deck-slot.ts - Gestiona drop sobre slots del deck principal en Arsenal.
import { DragEvent } from "react";
import { addCardToDeckSlotAction, removeCardFromDeckAction } from "@/services/home/deck-builder/deck-builder-actions";
import { applyOptimisticAddToDeckSlot, applyOptimisticRemoveFromDeck } from "@/components/hub/home/internal/optimistic/optimistic-deck-updates";
import { IHomeDraggedCardState } from "@/components/hub/home/internal/types/home-deck-builder-types";
import { IHomeDropHandlerDeps } from "@/components/hub/home/internal/dnd/home-drop-handler-deps";

interface IHandleHomeDropOnDeckSlotInput extends IHomeDropHandlerDeps {
  slotIndex: number;
  event: DragEvent<HTMLElement>;
  draggedCard: IHomeDraggedCardState | null;
  setSelectedSlotIndex: (slotIndex: number | null) => void;
  setSelectedCollectionCardId: (cardId: string | null) => void;
}

export async function handleHomeDropOnDeckSlot(input: IHandleHomeDropOnDeckSlotInput): Promise<void> {
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
    setSelectedSlotIndex,
    setSelectedCollectionCardId,
    resolveActionErrorMessage,
  } = input;
  event.preventDefault();
  if (!draggedCard) return;
  if (draggedCard.source === "FUSION") {
    setErrorMessage("Una carta de FUSIÓN no se puede mover al Deck principal.");
    setDraggedCard(null);
    return;
  }
  if (draggedCard.source === "DECK") {
    if (typeof draggedCard.slotIndex !== "number") {
      setDraggedCard(null);
      return;
    }
    const sourceIndex = draggedCard.slotIndex;
    if (sourceIndex === slotIndex) {
      setDraggedCard(null);
      return;
    }
    const sourceCardId = deck.slots[sourceIndex]?.cardId;
    const targetCardId = deck.slots[slotIndex]?.cardId;
    if (!sourceCardId) {
      setDraggedCard(null);
      return;
    }
    if (targetCardId !== null) {
      setErrorMessage("El slot de destino ya está ocupado.");
      setDraggedCard(null);
      return;
    }
    const previousDeck = deck;
    setDeck((currentDeck) => {
      const withoutSource = applyOptimisticRemoveFromDeck(currentDeck, sourceIndex);
      return applyOptimisticAddToDeckSlot(withoutSource, slotIndex, sourceCardId);
    });
    play("ADD_CARD");
    const mutationId = beginMutation();
    try {
      const deckAfterRemove = await removeCardFromDeckAction(context, sourceIndex);
      const finalDeck = await addCardToDeckSlotAction({ ...context, deck: deckAfterRemove }, sourceCardId, slotIndex);
      if (isLatestMutation(mutationId)) setDeck(finalDeck);
      setSelectedSlotIndex(slotIndex);
      setSelectedCollectionCardId(null);
      setErrorMessage(null);
    } catch (error) {
      if (isLatestMutation(mutationId)) setDeck(previousDeck);
      setErrorMessage(resolveActionErrorMessage(error, "No se pudo mover la carta al slot de deck."));
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
  if (droppedCard.type === "FUSION") {
    setErrorMessage("Las cartas de FUSIÓN solo se pueden colocar en Bloque Fusiones.");
    setDraggedCard(null);
    return;
  }
  const previousDeck = deck;
  if (previousDeck.slots[slotIndex]?.cardId !== null) {
    setErrorMessage("Ese slot ya está ocupado. Libéralo antes de mover una carta.");
    setDraggedCard(null);
    return;
  }
  setDeck((currentDeck) => applyOptimisticAddToDeckSlot(currentDeck, slotIndex, draggedCard.cardId));
  play("ADD_CARD");
  const mutationId = beginMutation();
  try {
    const updatedDeck = await addCardToDeckSlotAction(context, draggedCard.cardId, slotIndex);
    if (isLatestMutation(mutationId)) setDeck(updatedDeck);
    setSelectedCollectionCardId(draggedCard.cardId);
    setErrorMessage(null);
  } catch (error) {
    if (isLatestMutation(mutationId)) setDeck(previousDeck);
    setErrorMessage(resolveActionErrorMessage(error, "No se pudo colocar la carta en el slot de deck."));
  } finally {
    setDraggedCard(null);
  }
}

