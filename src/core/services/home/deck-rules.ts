// src/core/services/home/deck-rules.ts - Reglas puras del deck builder: tamaño, duplicados y operaciones de slots.
import { IDeck } from "@/core/entities/home/IDeck";
import { GameRuleError } from "@/core/errors/GameRuleError";

export const HOME_DECK_SIZE = 20;
export const HOME_FUSION_DECK_SIZE = 2;
export const HOME_MAX_DUPLICATES = 3;

export function countDeckCopies(deck: IDeck, cardId: string): number {
  return deck.slots.filter((slot) => slot.cardId === cardId).length;
}

export function findFirstEmptyDeckSlot(deck: IDeck): number {
  return deck.slots.findIndex((slot) => slot.cardId === null);
}

export function assertCanAddCardToDeck(deck: IDeck, cardId: string): void {
  if (findFirstEmptyDeckSlot(deck) < 0) {
    throw new GameRuleError("El deck ya tiene 20 cartas.");
  }

  if (countDeckCopies(deck, cardId) >= HOME_MAX_DUPLICATES) {
    throw new GameRuleError("No se permiten más de 3 copias de la misma carta.");
  }
}

export function assertDeckReadyToSave(deck: IDeck): void {
  if (deck.slots.length !== HOME_DECK_SIZE) {
    throw new GameRuleError("El deck debe tener exactamente 20 slots.");
  }

  if (deck.slots.some((slot) => slot.cardId === null)) {
    throw new GameRuleError("El deck debe tener 20 cartas antes de guardar.");
  }

  const duplicatesMap = new Map<string, number>();
  for (const slot of deck.slots) {
    const cardId = slot.cardId;
    if (!cardId) {
      continue;
    }
    duplicatesMap.set(cardId, (duplicatesMap.get(cardId) ?? 0) + 1);
    if ((duplicatesMap.get(cardId) ?? 0) > HOME_MAX_DUPLICATES) {
      throw new GameRuleError("No se permiten más de 3 copias de la misma carta.");
    }
  }
  if (deck.fusionSlots.length !== HOME_FUSION_DECK_SIZE) {
    throw new GameRuleError("El bloque de fusión debe tener exactamente 2 slots.");
  }
}

export function countAssignedCopies(deck: IDeck, cardId: string): number {
  const mainDeckCopies = deck.slots.filter((slot) => slot.cardId === cardId).length;
  const fusionDeckCopies = deck.fusionSlots.filter((slot) => slot.cardId === cardId).length;
  return mainDeckCopies + fusionDeckCopies;
}
