// src/components/hub/home/internal/hooks/use-home-workspace-handlers.ts - Construye handlers de selección y drag/drop del workspace de Home.
import { Dispatch, DragEvent, SetStateAction } from "react";
import { IDeck } from "@/core/entities/home/IDeck";
import { ICollectionCard } from "@/core/entities/home/ICollectionCard";
import { IHomeDraggedCardState } from "@/components/hub/home/internal/types/home-deck-builder-types";
import { IHomeDeckActionContext } from "@/components/hub/home/internal/actions/home-action-deps";
import { createHomeDropHandlers } from "@/components/hub/home/internal/hooks/create-home-drop-handlers";

interface IUseHomeWorkspaceHandlersInput {
  deck: IDeck;
  collectionState: ICollectionCard[];
  context: IHomeDeckActionContext;
  draggedCard: IHomeDraggedCardState | null;
  selectedSlotIndex: number | null;
  selectedFusionSlotIndex: number | null;
  selectedCollectionCardId: string | null;
  play: (soundId: "ADD_CARD" | "REMOVE_CARD" | "DETAIL_OPEN") => void;
  enqueueDeckMutation: <TResult>(input: {
    applyOptimistic: () => void;
    run: () => Promise<TResult>;
    onSuccess: (result: TResult) => Promise<void> | void;
    onError: (error: unknown) => Promise<void> | void;
  }) => Promise<TResult | null>;
  setDeck: Dispatch<SetStateAction<IDeck>>;
  setDraggedCard: Dispatch<SetStateAction<IHomeDraggedCardState | null>>;
  setErrorMessage: Dispatch<SetStateAction<string | null>>;
  setSelectedSlotIndex: Dispatch<SetStateAction<number | null>>;
  setSelectedFusionSlotIndex: Dispatch<SetStateAction<number | null>>;
  setSelectedCollectionCardId: Dispatch<SetStateAction<string | null>>;
  resolveActionErrorMessage: (error: unknown, fallback: string) => string;
}

/**
 * Expone handlers de selección y drag&drop del builder sin mezclar reglas de dominio.
 */
export function useHomeWorkspaceHandlers(input: IUseHomeWorkspaceHandlersInput) {
  const {
    deck,
    collectionState,
    context,
    draggedCard,
    selectedSlotIndex,
    selectedFusionSlotIndex,
    selectedCollectionCardId,
    play,
    enqueueDeckMutation,
    setDeck,
    setDraggedCard,
    setErrorMessage,
    setSelectedSlotIndex,
    setSelectedFusionSlotIndex,
    setSelectedCollectionCardId,
    resolveActionErrorMessage,
  } = input;
  // La selección es mutuamente excluyente para evitar ambigüedad entre slot, fusión y colección.
  const onSelectSlot = (slotIndex: number) => {
    setErrorMessage(null);
    setSelectedCollectionCardId(null);
    setSelectedFusionSlotIndex(null);
    const cardId = deck.slots[slotIndex]?.cardId ?? null;
    setSelectedSlotIndex((previous) => (previous === slotIndex ? null : slotIndex));
    if (cardId && selectedSlotIndex !== slotIndex) play("DETAIL_OPEN");
  };
  const onSelectFusionSlot = (slotIndex: number) => {
    setErrorMessage(null);
    setSelectedCollectionCardId(null);
    setSelectedSlotIndex(null);
    const cardId = deck.fusionSlots[slotIndex]?.cardId ?? null;
    setSelectedFusionSlotIndex((previous) => (previous === slotIndex ? null : slotIndex));
    if (cardId && selectedFusionSlotIndex !== slotIndex) play("DETAIL_OPEN");
  };
  const onSelectCollectionCard = (cardId: string) => {
    setErrorMessage(null);
    setSelectedSlotIndex(null);
    setSelectedCollectionCardId((previous) => (previous === cardId ? null : cardId));
    if (selectedCollectionCardId !== cardId) play("DETAIL_OPEN");
  };
  const onStartDragCollectionCard = (cardId: string, event: DragEvent<HTMLElement>) => {
    event.dataTransfer.effectAllowed = "move";
    setDraggedCard({ cardId, source: "COLLECTION" });
  };
  const onStartDragDeckSlot = (slotIndex: number, event: DragEvent<HTMLElement>) => {
    const cardId = deck.slots[slotIndex]?.cardId;
    if (!cardId) return;
    event.dataTransfer.effectAllowed = "move";
    setDraggedCard({ cardId, source: "DECK", slotIndex });
  };
  const onStartDragFusionSlot = (slotIndex: number, event: DragEvent<HTMLElement>) => {
    const cardId = deck.fusionSlots[slotIndex]?.cardId;
    if (!cardId) return;
    event.dataTransfer.effectAllowed = "move";
    setDraggedCard({ cardId, source: "FUSION", slotIndex });
  };
  const { onDropOnDeckSlot, onDropOnFusionSlot, onDropOnCollectionArea } = createHomeDropHandlers({
    draggedCard,
    deck,
    collectionState,
    context,
    play,
    enqueueDeckMutation,
    setDeck,
    setDraggedCard,
    setErrorMessage,
    setSelectedSlotIndex,
    setSelectedFusionSlotIndex,
    setSelectedCollectionCardId,
    resolveActionErrorMessage,
  });
  return {
    onSelectSlot,
    onSelectFusionSlot,
    onSelectCollectionCard,
    onStartDragCollectionCard,
    onStartDragDeckSlot,
    onStartDragFusionSlot,
    onDropOnDeckSlot,
    onDropOnFusionSlot,
    onDropOnCollectionArea,
  };
}
