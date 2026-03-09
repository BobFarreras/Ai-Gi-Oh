// src/components/hub/home/internal/actions/handle-home-remove-selected-card.ts - Resuelve retirada de carta seleccionada desde deck principal o bloque de fusión.
import { removeCardFromDeckAction, removeCardFromFusionDeckAction } from "@/services/home/deck-builder/deck-builder-actions";
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
    beginMutation,
    isLatestMutation,
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
    play("REMOVE_CARD");
    setDeck((currentDeck) => applyOptimisticRemoveFromFusion(currentDeck, selectedFusionSlotIndex));
    const mutationId = beginMutation();
    try {
      const updatedDeck = await removeCardFromFusionDeckAction(context, selectedFusionSlotIndex);
      if (isLatestMutation(mutationId)) setDeck(updatedDeck);
      setErrorMessage(null);
      endInteraction(telemetry, "ok");
      return { ok: true };
    } catch (error) {
      if (isLatestMutation(mutationId)) setDeck(previousDeck);
      const message = resolveActionErrorMessage(error, "No se pudo retirar la carta del bloque de fusión.");
      setErrorMessage(message);
      endInteraction(telemetry, "error");
      return { ok: false, message };
    }
  }
  const mainSlotIndex = selectedSlotIndex;
  if (mainSlotIndex === null) return { ok: false, message: "Selecciona una carta del deck para removerla." };
  const previousDeck = deck;
  play("REMOVE_CARD");
  setDeck((currentDeck) => applyOptimisticRemoveFromDeck(currentDeck, mainSlotIndex));
  const mutationId = beginMutation();
  try {
    const updatedDeck = await removeCardFromDeckAction(context, mainSlotIndex);
    if (isLatestMutation(mutationId)) setDeck(updatedDeck);
    setErrorMessage(null);
    endInteraction(telemetry, "ok");
    return { ok: true };
  } catch (error) {
    if (isLatestMutation(mutationId)) setDeck(previousDeck);
    const message = resolveActionErrorMessage(error, "No se pudo remover la carta del deck.");
    setErrorMessage(message);
    endInteraction(telemetry, "error");
    return { ok: false, message };
  }
}

