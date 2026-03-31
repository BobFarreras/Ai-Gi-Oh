// src/components/hub/home/internal/actions/handle-home-remove-selected-card.ts - Resuelve retirada de carta seleccionada desde deck principal o bloque de fusión.
import { readCurrentDeckAction, removeCardFromDeckAction, removeCardFromFusionDeckAction } from "@/services/home/deck-builder/deck-builder-actions";
import { applyOptimisticRemoveFromDeck, applyOptimisticRemoveFromFusion } from "@/components/hub/home/internal/optimistic/optimistic-deck-updates";
import { endInteraction, startInteraction } from "@/services/performance/dev-performance-telemetry";
import { IHomeActionDeps } from "@/components/hub/home/internal/actions/home-action-deps";
import { IHomeActionResult } from "@/components/hub/home/layout/home-workspace-types";

interface IHandleHomeRemoveSelectedCardInput extends IHomeActionDeps {
  selectedSlotIndex: number | null;
  selectedFusionSlotIndex: number | null;
}

export async function handleHomeRemoveSelectedCard(input: IHandleHomeRemoveSelectedCardInput): Promise<IHomeActionResult> {
  const {
    context,
    deck,
    setDeck,
    setErrorMessage,
    enqueueDeckMutation,
    resolveActionErrorMessage,
    play,
    selectedSlotIndex,
    selectedFusionSlotIndex,
  } = input;
  if (selectedSlotIndex === null && selectedFusionSlotIndex === null) {
    return { ok: false, message: "Selecciona una carta del deck para removerla." };
  }
  const telemetry = startInteraction("home.removeCard");
  if (selectedFusionSlotIndex !== null) {
    const previousDeck = deck;
    const result = await enqueueDeckMutation({
      applyOptimistic: () => {
        play("REMOVE_CARD");
        setDeck((currentDeck) => applyOptimisticRemoveFromFusion(currentDeck, selectedFusionSlotIndex));
      },
      run: () => removeCardFromFusionDeckAction(context, selectedFusionSlotIndex),
      onSuccess: () => {
        setErrorMessage(null);
      },
      onError: async (error) => {
        const message = resolveActionErrorMessage(error, "No se pudo retirar la carta del bloque de fusión.");
        setErrorMessage(message);
        try {
          const syncedDeck = await readCurrentDeckAction(context);
          setDeck(syncedDeck);
        } catch {
          setDeck(previousDeck);
        }
      },
    });
    if (result) {
      endInteraction(telemetry, "ok");
      return { ok: true };
    }
    const message = "No se pudo retirar la carta del bloque de fusión.";
    endInteraction(telemetry, "error");
    return { ok: false, message };
  }
  const mainSlotIndex = selectedSlotIndex;
  if (mainSlotIndex === null) return { ok: false, message: "Selecciona una carta del deck para removerla." };
  const previousDeck = deck;
  const result = await enqueueDeckMutation({
    applyOptimistic: () => {
      play("REMOVE_CARD");
      setDeck((currentDeck) => applyOptimisticRemoveFromDeck(currentDeck, mainSlotIndex));
    },
    run: () => removeCardFromDeckAction(context, mainSlotIndex),
    onSuccess: () => {
      setErrorMessage(null);
    },
    onError: async (error) => {
      const message = resolveActionErrorMessage(error, "No se pudo remover la carta del deck.");
      setErrorMessage(message);
      try {
        const syncedDeck = await readCurrentDeckAction(context);
        setDeck(syncedDeck);
      } catch {
        setDeck(previousDeck);
      }
    },
  });
  if (result) {
    endInteraction(telemetry, "ok");
    return { ok: true };
  }
  const message = "No se pudo remover la carta del deck.";
  endInteraction(telemetry, "error");
  return { ok: false, message };
}

