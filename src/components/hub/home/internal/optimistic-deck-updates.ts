// src/components/hub/home/internal/optimistic-deck-updates.ts - Helpers de actualización optimista del deck para respuesta inmediata en Mi Home.
import { IDeck } from "@/core/entities/home/IDeck";

export function applyOptimisticAddToDeck(deck: IDeck, cardId: string): IDeck {
  const emptySlot = deck.slots.find((slot) => slot.cardId === null);
  if (!emptySlot) return deck;
  const slots = deck.slots.map((slot) => (slot.index === emptySlot.index ? { ...slot, cardId } : slot));
  return { ...deck, slots };
}

export function applyOptimisticRemoveFromDeck(deck: IDeck, slotIndex: number): IDeck {
  const slots = deck.slots.map((slot) => (slot.index === slotIndex ? { ...slot, cardId: null } : slot));
  return { ...deck, slots };
}

export function applyOptimisticAddToDeckSlot(deck: IDeck, slotIndex: number, cardId: string): IDeck {
  const slots = deck.slots.map((slot) => (slot.index === slotIndex ? { ...slot, cardId } : slot));
  return { ...deck, slots };
}

export function applyOptimisticAddToFusionSlot(deck: IDeck, slotIndex: number, cardId: string): IDeck {
  const fusionSlots = deck.fusionSlots.map((slot) => (slot.index === slotIndex ? { ...slot, cardId } : slot));
  return { ...deck, fusionSlots };
}

export function applyOptimisticRemoveFromFusion(deck: IDeck, slotIndex: number): IDeck {
  const fusionSlots = deck.fusionSlots.map((slot) => (slot.index === slotIndex ? { ...slot, cardId: null } : slot));
  return { ...deck, fusionSlots };
}
