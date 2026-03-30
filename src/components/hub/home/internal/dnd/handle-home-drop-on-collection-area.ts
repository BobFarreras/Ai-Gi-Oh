// src/components/hub/home/internal/dnd/handle-home-drop-on-collection-area.ts - Gestiona devolución de cartas al almacén desde deck principal o bloque de fusión.
import { DragEvent } from "react";
import { readCurrentDeckAction, removeCardFromDeckAction, removeCardFromFusionDeckAction } from "@/services/home/deck-builder/deck-builder-actions";
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
    enqueueDeckMutation,
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
    await enqueueDeckMutation({
      applyOptimistic: () => {
        setDeck((currentDeck) => applyOptimisticRemoveFromDeck(currentDeck, slotIndex));
        play("REMOVE_CARD");
      },
      run: () => removeCardFromDeckAction(context, slotIndex),
      onSuccess: () => {
        setErrorMessage(null);
      },
      onError: async (error) => {
        setErrorMessage(resolveActionErrorMessage(error, "No se pudo devolver la carta al almacén."));
        try {
          const syncedDeck = await readCurrentDeckAction(context);
          setDeck(syncedDeck);
        } catch {
          setDeck(previousDeck);
        }
      },
    });
  }
  if (draggedCard.source === "FUSION" && typeof draggedCard.slotIndex === "number") {
    const slotIndex = draggedCard.slotIndex;
    const previousDeck = deck;
    await enqueueDeckMutation({
      applyOptimistic: () => {
        setDeck((currentDeck) => applyOptimisticRemoveFromFusion(currentDeck, slotIndex));
        play("REMOVE_CARD");
      },
      run: () => removeCardFromFusionDeckAction(context, slotIndex),
      onSuccess: () => {
        setErrorMessage(null);
      },
      onError: async (error) => {
        setErrorMessage(resolveActionErrorMessage(error, "No se pudo devolver la carta al almacén."));
        try {
          const syncedDeck = await readCurrentDeckAction(context);
          setDeck(syncedDeck);
        } catch {
          setDeck(previousDeck);
        }
      },
    });
  }
  setDraggedCard(null);
}

