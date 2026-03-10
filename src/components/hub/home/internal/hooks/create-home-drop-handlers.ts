// src/components/hub/home/internal/hooks/create-home-drop-handlers.ts - Fabrica handlers de drop para deck/fusion/collection sin mezclar selección de UI.
import { Dispatch, DragEvent, SetStateAction } from "react";
import { IDeck } from "@/core/entities/home/IDeck";
import { ICollectionCard } from "@/core/entities/home/ICollectionCard";
import { IHomeDraggedCardState } from "@/components/hub/home/internal/types/home-deck-builder-types";
import { handleHomeDropOnDeckSlot } from "@/components/hub/home/internal/dnd/handle-home-drop-on-deck-slot";
import { handleHomeDropOnFusionSlot } from "@/components/hub/home/internal/dnd/handle-home-drop-on-fusion-slot";
import { handleHomeDropOnCollectionArea } from "@/components/hub/home/internal/dnd/handle-home-drop-on-collection-area";
import { IHomeDeckActionContext } from "@/components/hub/home/internal/actions/home-action-deps";

interface ICreateHomeDropHandlersInput {
  draggedCard: IHomeDraggedCardState | null;
  deck: IDeck;
  collectionState: ICollectionCard[];
  context: IHomeDeckActionContext;
  play: (soundId: "ADD_CARD" | "REMOVE_CARD" | "DETAIL_OPEN") => void;
  beginMutation: () => number;
  isLatestMutation: (mutationId: number) => boolean;
  setDeck: Dispatch<SetStateAction<IDeck>>;
  setDraggedCard: Dispatch<SetStateAction<IHomeDraggedCardState | null>>;
  setErrorMessage: Dispatch<SetStateAction<string | null>>;
  setSelectedSlotIndex: Dispatch<SetStateAction<number | null>>;
  setSelectedFusionSlotIndex: Dispatch<SetStateAction<number | null>>;
  setSelectedCollectionCardId: Dispatch<SetStateAction<string | null>>;
  resolveActionErrorMessage: (error: unknown, fallback: string) => string;
}

/**
 * Crea handlers de drop con dependencias inyectadas para evitar lógica densa en el hook principal.
 */
export function createHomeDropHandlers(input: ICreateHomeDropHandlersInput) {
  const onDropOnDeckSlot = async (slotIndex: number, event: DragEvent<HTMLElement>) => {
    await handleHomeDropOnDeckSlot({
      slotIndex,
      event,
      draggedCard: input.draggedCard,
      deck: input.deck,
      collectionState: input.collectionState,
      context: input.context,
      play: input.play,
      beginMutation: input.beginMutation,
      isLatestMutation: input.isLatestMutation,
      setDeck: input.setDeck,
      setDraggedCard: input.setDraggedCard,
      setErrorMessage: input.setErrorMessage,
      setSelectedSlotIndex: input.setSelectedSlotIndex,
      setSelectedCollectionCardId: input.setSelectedCollectionCardId,
      resolveActionErrorMessage: input.resolveActionErrorMessage,
    });
  };
  const onDropOnFusionSlot = async (slotIndex: number, event: DragEvent<HTMLElement>) => {
    await handleHomeDropOnFusionSlot({
      slotIndex,
      event,
      draggedCard: input.draggedCard,
      deck: input.deck,
      collectionState: input.collectionState,
      context: input.context,
      play: input.play,
      beginMutation: input.beginMutation,
      isLatestMutation: input.isLatestMutation,
      setDeck: input.setDeck,
      setDraggedCard: input.setDraggedCard,
      setErrorMessage: input.setErrorMessage,
      setSelectedFusionSlotIndex: input.setSelectedFusionSlotIndex,
      setSelectedCollectionCardId: input.setSelectedCollectionCardId,
      resolveActionErrorMessage: input.resolveActionErrorMessage,
    });
  };
  const onDropOnCollectionArea = async (event: DragEvent<HTMLElement>) => {
    await handleHomeDropOnCollectionArea({
      event,
      draggedCard: input.draggedCard,
      deck: input.deck,
      collectionState: input.collectionState,
      context: input.context,
      play: input.play,
      beginMutation: input.beginMutation,
      isLatestMutation: input.isLatestMutation,
      setDeck: input.setDeck,
      setDraggedCard: input.setDraggedCard,
      setErrorMessage: input.setErrorMessage,
      resolveActionErrorMessage: input.resolveActionErrorMessage,
    });
  };
  return { onDropOnDeckSlot, onDropOnFusionSlot, onDropOnCollectionArea };
}
