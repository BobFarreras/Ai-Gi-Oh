// src/components/hub/academy/tutorial/nodes/arsenal/internal/use-tutorial-arsenal-selection-handlers.ts - Handlers de selección del Arsenal tutorial (slots, fusión, colección) y drag-and-drop deshabilitado.
import { useCallback, useMemo } from "react";
import { useTutorialArsenalSandbox } from "./use-tutorial-arsenal-sandbox";
import { useHubModuleSfx } from "@/components/hub/internal/use-hub-module-sfx";

type SandboxApi = ReturnType<typeof useTutorialArsenalSandbox>;
type PlaySfx = ReturnType<typeof useHubModuleSfx>["play"];

interface IUseTutorialArsenalSelectionHandlersInput {
  sandbox: SandboxApi;
  play: PlaySfx;
}

interface IUseTutorialArsenalSelectionHandlersOutput {
  onSelectSlot: (slotIndex: number) => void;
  onSelectFusionSlot: (slotIndex: number) => void;
  onSelectCollectionCard: (cardId: string) => void;
  dragHandlers: {
    onStartDragCollectionCard: () => void;
    onStartDragDeckSlot: () => void;
    onStartDragFusionSlot: () => void;
    onDropOnDeckSlot: () => void;
    onDropOnFusionSlot: () => void;
    onDropOnCollectionArea: () => void;
  };
}

const NOOP_DRAG_HANDLERS = {
  onStartDragCollectionCard: () => {},
  onStartDragDeckSlot: () => {},
  onStartDragFusionSlot: () => {},
  onDropOnDeckSlot: () => {},
  onDropOnFusionSlot: () => {},
  onDropOnCollectionArea: () => {},
};

/**
 * Centraliza los callbacks de selección del tutorial de Arsenal para mantener
 * el componente cliente enfocado en orquestación y no en detalles de eventos.
 */
export function useTutorialArsenalSelectionHandlers(
  input: IUseTutorialArsenalSelectionHandlersInput,
): IUseTutorialArsenalSelectionHandlersOutput {
  const { sandbox, play } = input;

  const selectSound = useCallback(() => play("DETAIL_OPEN"), [play]);

  const onSelectSlot = useCallback(
    (slotIndex: number) => {
      selectSound();
      sandbox.state.setSelectedSlotIndex(slotIndex);
      sandbox.state.setSelectedFusionSlotIndex(null);
      sandbox.state.setSelectedCollectionCardId(null);
    },
    [selectSound, sandbox.state],
  );

  const onSelectFusionSlot = useCallback(
    (slotIndex: number) => {
      selectSound();
      sandbox.state.setSelectedFusionSlotIndex(slotIndex);
      sandbox.state.setSelectedSlotIndex(null);
      sandbox.state.setSelectedCollectionCardId(null);
    },
    [selectSound, sandbox.state],
  );

  const onSelectCollectionCard = useCallback(
    (cardId: string) => {
      selectSound();
      sandbox.state.setSelectedCollectionCardId(cardId);
      sandbox.state.setSelectedSlotIndex(null);
      sandbox.state.setSelectedFusionSlotIndex(null);
    },
    [selectSound, sandbox.state],
  );

  return useMemo(
    () => ({
      onSelectSlot,
      onSelectFusionSlot,
      onSelectCollectionCard,
      dragHandlers: NOOP_DRAG_HANDLERS,
    }),
    [onSelectSlot, onSelectFusionSlot, onSelectCollectionCard],
  );
}
