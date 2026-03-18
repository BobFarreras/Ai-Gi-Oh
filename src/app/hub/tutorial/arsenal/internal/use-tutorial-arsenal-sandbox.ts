// src/app/hub/tutorial/arsenal/internal/use-tutorial-arsenal-sandbox.ts - Gestiona estado local mock del Arsenal tutorial con acciones sin persistencia remota.
"use client";
import { useCallback } from "react";
import { HOME_DECK_SIZE } from "@/core/services/home/deck-rules";
import { useHomeDeckBuilderState } from "@/components/hub/home/internal/hooks/use-home-deck-builder-state";
import { IHomeDeckBuilderSceneProps } from "@/components/hub/home/internal/types/home-deck-builder-types";
import { useTutorialFlowController } from "@/components/tutorial/flow/useTutorialFlowController";
import { useHubModuleSfx } from "@/components/hub/internal/use-hub-module-sfx";

interface IUseTutorialArsenalSandboxInput extends IHomeDeckBuilderSceneProps {
  tutorial: ReturnType<typeof useTutorialFlowController>;
}

/**
 * Encapsula mutaciones locales del tutorial para evitar llamadas API y mantener un entorno de práctica estable.
 */
export function useTutorialArsenalSandbox(input: IUseTutorialArsenalSandboxInput) {
  const state = useHomeDeckBuilderState(input);
  const { play } = useHubModuleSfx();

  const insertSelectedCard = useCallback(async () => {
    if (!state.selectedCollectionCardId) return { ok: false, message: "Selecciona una carta del almacén." };
    const selectedEntry = state.collectionState.find((entry) => entry.card.id === state.selectedCollectionCardId) ?? null;
    if (!selectedEntry) return { ok: false, message: "No se encontró la carta seleccionada en el almacén." };
    if (selectedEntry.card.type === "FUSION") {
      const hasFreeFusionSlot = state.deck.fusionSlots.some((slot) => slot.cardId === null);
      if (!hasFreeFusionSlot) return { ok: false, message: "El bloque de fusión ya está completo (2/2)." };
      state.setDeck((currentDeck) => {
        const target = currentDeck.fusionSlots.find((slot) => slot.cardId === null);
        if (!target) return currentDeck;
        const nextFusionSlots = currentDeck.fusionSlots.map((slot) =>
          slot.index === target.index ? { ...slot, cardId: state.selectedCollectionCardId } : slot,
        );
        return { ...currentDeck, fusionSlots: nextFusionSlots };
      });
      state.setErrorMessage(null);
      play("ADD_CARD");
      return { ok: true };
    }
    const hasFreeMainSlot = state.deck.slots.some((slot) => slot.cardId === null);
    if (!hasFreeMainSlot) return { ok: false, message: `El deck está completo (${HOME_DECK_SIZE}/${HOME_DECK_SIZE}).` };
    state.setDeck((currentDeck) => {
      const target = currentDeck.slots.find((slot) => slot.cardId === null);
      if (!target) return currentDeck;
      const nextSlots = currentDeck.slots.map((slot) =>
        slot.index === target.index ? { ...slot, cardId: state.selectedCollectionCardId } : slot,
      );
      return { ...currentDeck, slots: nextSlots };
    });
    if (input.tutorial.currentStep?.id === "arsenal-add-deck") input.tutorial.onAction("ADD_CARD_TO_DECK");
    state.setErrorMessage(null);
    play("ADD_CARD");
    return { ok: true };
  }, [input.tutorial, play, state]);

  const removeSelectedCard = useCallback(async () => {
    if (state.selectedSlotIndex === null && state.selectedFusionSlotIndex === null) {
      return { ok: false, message: "Selecciona una carta del deck o del bloque de fusión para remover." };
    }
    state.setDeck((currentDeck) => {
      if (state.selectedSlotIndex !== null) {
        return {
          ...currentDeck,
          slots: currentDeck.slots.map((slot) => (slot.index === state.selectedSlotIndex ? { ...slot, cardId: null } : slot)),
        };
      }
      if (state.selectedFusionSlotIndex !== null) {
        return {
          ...currentDeck,
          fusionSlots: currentDeck.fusionSlots.map((slot) =>
            slot.index === state.selectedFusionSlotIndex ? { ...slot, cardId: null } : slot,
          ),
        };
      }
      return currentDeck;
    });
    if (input.tutorial.currentStep?.id === "arsenal-remove-deck") input.tutorial.onAction("REMOVE_CARD_FROM_DECK");
    state.setErrorMessage(null);
    play("REMOVE_CARD");
    return { ok: true };
  }, [input.tutorial, play, state]);

  const evolveSelectedCard = useCallback(async () => {
    if (!state.selectedCardId || !state.canEvolveSelectedCard || !state.copiesRequiredToEvolve) {
      return { ok: false, message: "Selecciona una carta evolvable del almacén." };
    }
    const previousTier = state.selectedCardVersionTier;
    const nextTier = previousTier + 1;
    state.setCollectionState((current) =>
      current
        .map((entry) =>
          entry.card.id === state.selectedCardId
            ? { ...entry, ownedCopies: Math.max(0, entry.ownedCopies - state.copiesRequiredToEvolve!) }
            : entry,
        )
        .filter((entry) => entry.ownedCopies > 0),
    );
    state.setCardProgressById((current) => {
      const next = new Map(current);
      next.set(state.selectedCardId!, {
        playerId: input.playerId,
        cardId: state.selectedCardId!,
        versionTier: nextTier,
        level: state.selectedCardLevel,
        xp: state.selectedCardXp,
        masteryPassiveSkillId: state.selectedCardMasteryPassiveSkillId,
        updatedAtIso: new Date().toISOString(),
      });
      return next;
    });
    state.setEvolutionOverlay({
      cardId: state.selectedCardId,
      fromVersionTier: previousTier,
      toVersionTier: nextTier,
      level: state.selectedCardLevel,
      consumedCopies: state.copiesRequiredToEvolve,
    });
    play("EVOLUTION_OVERLAY");
    setTimeout(() => state.setEvolutionOverlay(null), 4300);
    if (input.tutorial.currentStep?.id === "arsenal-open-evolve") input.tutorial.onAction("OPEN_EVOLVE_PANEL");
    state.setErrorMessage(null);
    play("EVOLUTION_BUTTON");
    return { ok: true };
  }, [input.playerId, input.tutorial, play, state]);

  return { state, insertSelectedCard, removeSelectedCard, evolveSelectedCard };
}
