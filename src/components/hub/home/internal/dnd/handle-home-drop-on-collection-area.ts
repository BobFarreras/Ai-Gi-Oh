// src/components/hub/home/internal/dnd/handle-home-drop-on-collection-area.ts - Gestiona devolución de cartas al almacén desde deck principal o bloque de fusión.
import { DragEvent } from "react";
import { removeCardFromDeckAction, removeCardFromFusionDeckAction } from "@/services/home/deck-builder/deck-builder-actions";
import { applyOptimisticRemoveFromDeck, applyOptimisticRemoveFromFusion } from "@/components/hub/home/internal/optimistic/optimistic-deck-updates";
import { IHomeDraggedCardState } from "@/components/hub/home/internal/types/home-deck-builder-types";
import { IHomeDropHandlerDeps } from "@/components/hub/home/internal/dnd/home-drop-handler-deps";

interface IHandleHomeDropOnCollectionAreaInput extends IHomeDropHandlerDeps {
  event: DragEvent<HTMLElement>;
  draggedCard: IHomeDraggedCardState | null;
}

export async function handleHomeDropOnCollectionArea(input: IHandleHomeDropOnCollectionAreaInput): Promise<void> {
  const {
    event,
    draggedCard,
    deck,
    context,
    play,
    beginMutation,
    isLatestMutation,
    setDeck,
    setDraggedCard,
    setErrorMessage,
    resolveActionErrorMessage,
  } = input;
  event.preventDefault();
  if (!draggedCard) return;
  if (draggedCard.source === "DECK" && typeof draggedCard.slotIndex === "number") {
    const slotIndex = draggedCard.slotIndex;
    const previousDeck = deck;
    setDeck((currentDeck) => applyOptimisticRemoveFromDeck(currentDeck, slotIndex));
    play("REMOVE_CARD");
    const mutationId = beginMutation();
    try {
      const updatedDeck = await removeCardFromDeckAction(context, slotIndex);
      if (isLatestMutation(mutationId)) setDeck(updatedDeck);
      setErrorMessage(null);
    } catch (error) {
      if (isLatestMutation(mutationId)) setDeck(previousDeck);
      setErrorMessage(resolveActionErrorMessage(error, "No se pudo devolver la carta al almacén."));
    }
  }
  if (draggedCard.source === "FUSION" && typeof draggedCard.slotIndex === "number") {
    const slotIndex = draggedCard.slotIndex;
    const previousDeck = deck;
    setDeck((currentDeck) => applyOptimisticRemoveFromFusion(currentDeck, slotIndex));
    play("REMOVE_CARD");
    const mutationId = beginMutation();
    try {
      const updatedDeck = await removeCardFromFusionDeckAction(context, slotIndex);
      if (isLatestMutation(mutationId)) setDeck(updatedDeck);
      setErrorMessage(null);
    } catch (error) {
      if (isLatestMutation(mutationId)) setDeck(previousDeck);
      setErrorMessage(resolveActionErrorMessage(error, "No se pudo devolver la carta al almacén."));
    }
  }
  setDraggedCard(null);
}

