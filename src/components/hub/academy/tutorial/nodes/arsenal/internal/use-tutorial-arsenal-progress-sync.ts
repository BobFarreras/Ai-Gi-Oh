// src/components/hub/academy/tutorial/nodes/arsenal/internal/use-tutorial-arsenal-progress-sync.ts - Sincroniza avance de pasos y persistencia de completado del nodo Preparar Deck.
"use client";
import { useEffect, useRef } from "react";
import { useTutorialFlowController } from "@/components/tutorial/flow/useTutorialFlowController";
import { useTutorialNodeCompletionSync } from "@/components/hub/academy/tutorial/nodes/internal/use-tutorial-node-completion-sync";

interface IUseTutorialArsenalProgressSyncInput {
  selectedSlotIndex: number | null;
  selectedCollectionCardId: string | null;
  tutorial: ReturnType<typeof useTutorialFlowController>;
}

/**
 * Mantiene avance automático por selección y persistencia del nodo cuando el flujo termina.
 */
export function useTutorialArsenalProgressSync(input: IUseTutorialArsenalProgressSyncInput): void {
  const lastStepIdRef = useRef<string | null>(null);
  const selectionBaselineRef = useRef<{ collectionCardId: string | null; slotIndex: number | null }>({
    collectionCardId: null,
    slotIndex: null,
  });

  useEffect(() => {
    const stepId = input.tutorial.currentStep?.id ?? null;
    if (lastStepIdRef.current !== stepId) {
      // Reiniciamos baseline al cambiar de paso para que el avance solo cuente interacciones nuevas.
      lastStepIdRef.current = stepId;
      selectionBaselineRef.current = {
        collectionCardId: input.selectedCollectionCardId,
        slotIndex: input.selectedSlotIndex,
      };
    }
    if (
      stepId === "arsenal-select-deck-card" &&
      input.selectedSlotIndex !== null &&
      input.selectedSlotIndex !== selectionBaselineRef.current.slotIndex
    ) {
      input.tutorial.onAction("SELECT_DECK_CARD");
    }
    if (
      (stepId === "arsenal-select-collection-card" ||
        stepId === "arsenal-reselect-collection-card" ||
        stepId === "arsenal-evolution-theory") &&
      input.selectedCollectionCardId &&
      input.selectedCollectionCardId !== selectionBaselineRef.current.collectionCardId
    ) {
      input.tutorial.onAction("SELECT_COLLECTION_CARD");
    }
  }, [input.selectedCollectionCardId, input.selectedSlotIndex, input.tutorial]);
  useTutorialNodeCompletionSync({ tutorial: input.tutorial, nodeId: "tutorial-arsenal-basics" });
}
