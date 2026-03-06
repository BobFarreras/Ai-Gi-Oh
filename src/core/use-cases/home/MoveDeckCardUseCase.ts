// src/core/use-cases/home/MoveDeckCardUseCase.ts - Intercambia cartas entre dos slots del deck para reordenar el mazo.
import { IDeck } from "@/core/entities/home/IDeck";
import { ValidationError } from "@/core/errors/ValidationError";
import { IDeckRepository } from "@/core/repositories/IDeckRepository";
import { HOME_DECK_SIZE } from "@/core/services/home/deck-rules";
import { assertValidDeckIndex, assertValidPlayerId } from "@/core/use-cases/home/internal/assert-valid-home-input";

interface IMoveDeckCardInput {
  playerId: string;
  fromSlotIndex: number;
  toSlotIndex: number;
}

export class MoveDeckCardUseCase {
  constructor(private readonly deckRepository: IDeckRepository) {}

  async execute(input: IMoveDeckCardInput): Promise<IDeck> {
    assertValidPlayerId(input.playerId);
    assertValidDeckIndex(input.fromSlotIndex);
    assertValidDeckIndex(input.toSlotIndex);
    if (input.fromSlotIndex >= HOME_DECK_SIZE || input.toSlotIndex >= HOME_DECK_SIZE) {
      throw new ValidationError("El índice de slot excede el tamaño del deck.");
    }

    const deck = await this.deckRepository.getDeck(input.playerId);
    const updatedDeck: IDeck = { playerId: deck.playerId, slots: deck.slots.map((slot) => ({ ...slot })) };
    const fromCard = updatedDeck.slots[input.fromSlotIndex].cardId;
    const toCard = updatedDeck.slots[input.toSlotIndex].cardId;
    updatedDeck.slots[input.fromSlotIndex] = { ...updatedDeck.slots[input.fromSlotIndex], cardId: toCard };
    updatedDeck.slots[input.toSlotIndex] = { ...updatedDeck.slots[input.toSlotIndex], cardId: fromCard };
    await this.deckRepository.saveDeck(updatedDeck);
    return updatedDeck;
  }
}
