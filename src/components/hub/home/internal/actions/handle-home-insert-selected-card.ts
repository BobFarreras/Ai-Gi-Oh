// src/components/hub/home/internal/actions/handle-home-insert-selected-card.ts - Resuelve la inserción de carta seleccionada en deck o bloque de fusión.
import { addCardToDeckAction, addCardToFusionDeckAction } from "@/services/home/deck-builder/deck-builder-actions";
import { applyOptimisticAddToDeck, applyOptimisticAddToFusionSlot } from "@/components/hub/home/internal/optimistic/optimistic-deck-updates";
import { endInteraction, startInteraction } from "@/services/performance/dev-performance-telemetry";
import { IHomeActionDeps } from "@/components/hub/home/internal/actions/home-action-deps";
import { IHomeActionResult } from "@/components/hub/home/layout/home-workspace-types";

interface IHandleHomeInsertSelectedCardInput extends IHomeActionDeps {
  selectedCollectionCardId: string | null;
  selectedCollectionCardType: string | null;
  targetFusionSlotIndex: number | null;
}

export async function handleHomeInsertSelectedCard(input: IHandleHomeInsertSelectedCardInput): Promise<IHomeActionResult> {
  const {
    context,
    deck,
    setDeck,
    setErrorMessage,
    beginMutation,
    isLatestMutation,
    resolveActionErrorMessage,
    play,
    selectedCollectionCardId,
    selectedCollectionCardType,
    targetFusionSlotIndex,
  } = input;
  if (!selectedCollectionCardId) return { ok: false, message: "Selecciona una carta del almacén para añadirla." };
  const telemetry = startInteraction("home.insertCard");
  const previousDeck = deck;
  if (selectedCollectionCardType === "FUSION") {
    if (targetFusionSlotIndex === null) {
      const message = "No hay hueco libre en Bloque Fusiones.";
      setErrorMessage(message);
      return { ok: false, message };
    }
    setDeck((currentDeck) => applyOptimisticAddToFusionSlot(currentDeck, targetFusionSlotIndex, selectedCollectionCardId));
    play("ADD_CARD");
    const mutationId = beginMutation();
    try {
      const updatedDeck = await addCardToFusionDeckAction(context, selectedCollectionCardId, targetFusionSlotIndex);
      if (isLatestMutation(mutationId)) setDeck(updatedDeck);
      setErrorMessage(null);
      endInteraction(telemetry, "ok");
      return { ok: true };
    } catch (error) {
      if (isLatestMutation(mutationId)) setDeck(previousDeck);
      const message = resolveActionErrorMessage(error, "No se pudo equipar la carta en el bloque de fusión.");
      setErrorMessage(message);
      endInteraction(telemetry, "error");
      return { ok: false, message };
    }
  }
  if (selectedCollectionCardType === "FUSION") {
    const message = "Esta carta solo puede añadirse al Bloque Fusiones.";
    setErrorMessage(message);
    endInteraction(telemetry, "error");
    return { ok: false, message };
  }
  play("ADD_CARD");
  setDeck((currentDeck) => applyOptimisticAddToDeck(currentDeck, selectedCollectionCardId));
  const mutationId = beginMutation();
  try {
    const updatedDeck = await addCardToDeckAction(context, selectedCollectionCardId);
    if (isLatestMutation(mutationId)) setDeck(updatedDeck);
    setErrorMessage(null);
    endInteraction(telemetry, "ok");
    return { ok: true };
  } catch (error) {
    if (isLatestMutation(mutationId)) setDeck(previousDeck);
    const message = resolveActionErrorMessage(error, "No se pudo añadir la carta al deck.");
    setErrorMessage(message);
    endInteraction(telemetry, "error");
    return { ok: false, message };
  }
}

