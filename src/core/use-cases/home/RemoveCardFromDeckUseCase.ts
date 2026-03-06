// src/core/use-cases/home/RemoveCardFromDeckUseCase.ts - Quita una carta de un slot del deck para devolver espacio al mazo.
import { IDeck } from "@/core/entities/home/IDeck";
import { ValidationError } from "@/core/errors/ValidationError";
import { IDeckRepository } from "@/core/repositories/IDeckRepository";
import { HOME_DECK_SIZE } from "@/core/services/home/deck-rules";
import { assertValidDeckIndex, assertValidPlayerId } from "@/core/use-cases/home/internal/assert-valid-home-input";

interface IRemoveCardFromDeckInput {
  playerId: string;
  slotIndex: number;
}

export class RemoveCardFromDeckUseCase {
  constructor(private readonly deckRepository: IDeckRepository) {}

  async execute(input: IRemoveCardFromDeckInput): Promise<IDeck> {
    assertValidPlayerId(input.playerId);
    assertValidDeckIndex(input.slotIndex);
    if (input.slotIndex >= HOME_DECK_SIZE) {
      throw new ValidationError("El índice de slot excede el tamaño del deck.");
    }

    const deck = await this.deckRepository.getDeck(input.playerId);
    const updatedDeck: IDeck = { playerId: deck.playerId, slots: deck.slots.map((slot) => ({ ...slot })) };
    updatedDeck.slots[input.slotIndex] = { ...updatedDeck.slots[input.slotIndex], cardId: null };
    await this.deckRepository.saveDeck(updatedDeck);
    return updatedDeck;
  }
}
