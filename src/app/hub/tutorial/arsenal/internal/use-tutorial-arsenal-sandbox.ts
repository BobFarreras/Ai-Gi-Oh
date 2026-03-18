// src/app/hub/tutorial/arsenal/internal/use-tutorial-arsenal-sandbox.ts - Gestiona estado local mock del Arsenal tutorial con acciones sin persistencia remota.
"use client";
import { useCallback } from "react";
import { HOME_DECK_SIZE } from "@/core/services/home/deck-rules";
import { useHomeDeckBuilderState } from "@/components/hub/home/internal/hooks/use-home-deck-builder-state";
import { IHomeDeckBuilderSceneProps } from "@/components/hub/home/internal/types/home-deck-builder-types";
import { useTutorialFlowController } from "@/components/tutorial/flow/useTutorialFlowController";

interface IUseTutorialArsenalSandboxInput extends IHomeDeckBuilderSceneProps {
  tutorial: ReturnType<typeof useTutorialFlowController>;
}

/**
 * Encapsula mutaciones locales del tutorial para evitar llamadas API y mantener un entorno de práctica estable.
 */
export function useTutorialArsenalSandbox(input: IUseTutorialArsenalSandboxInput) {
  const state = useHomeDeckBuilderState(input);

  const insertSelectedCard = useCallback(async () => {
    if (!state.selectedCollectionCardId) return { ok: false, message: "Selecciona una carta del almacén." };
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
    return { ok: true };
  }, [input.tutorial, state]);

  const removeSelectedCard = useCallback(async () => {
    if (state.selectedSlotIndex === null) return { ok: false, message: "Selecciona una carta del deck para remover." };
    state.setDeck((currentDeck) => ({
      ...currentDeck,
      slots: currentDeck.slots.map((slot) => (slot.index === state.selectedSlotIndex ? { ...slot, cardId: null } : slot)),
    }));
    if (input.tutorial.currentStep?.id === "arsenal-remove-deck") input.tutorial.onAction("REMOVE_CARD_FROM_DECK");
    state.setErrorMessage(null);
    return { ok: true };
  }, [input.tutorial, state]);

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
    setTimeout(() => state.setEvolutionOverlay(null), 2200);
    if (input.tutorial.currentStep?.id === "arsenal-open-evolve") input.tutorial.onAction("OPEN_EVOLVE_PANEL");
    state.setErrorMessage(null);
    return { ok: true };
  }, [input.playerId, input.tutorial, state]);

  return { state, insertSelectedCard, removeSelectedCard, evolveSelectedCard };
}
