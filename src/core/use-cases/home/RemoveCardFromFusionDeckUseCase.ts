// src/core/use-cases/home/RemoveCardFromFusionDeckUseCase.ts - Limpia un slot del bloque de fusión del Arsenal.
import { IDeck } from "@/core/entities/home/IDeck";
import { ValidationError } from "@/core/errors/ValidationError";
import { IDeckRepository } from "@/core/repositories/IDeckRepository";
import { assertValidDeckIndex, assertValidPlayerId } from "@/core/use-cases/home/internal/assert-valid-home-input";

interface IRemoveCardFromFusionDeckInput {
  playerId: string;
  slotIndex: number;
}

export class RemoveCardFromFusionDeckUseCase {
  constructor(private readonly deckRepository: IDeckRepository) {}

  async execute(input: IRemoveCardFromFusionDeckInput): Promise<IDeck> {
    assertValidPlayerId(input.playerId);
    assertValidDeckIndex(input.slotIndex);
    const deck = await this.deckRepository.getDeck(input.playerId);
    const targetSlot = deck.fusionSlots[input.slotIndex];
    if (!targetSlot) throw new ValidationError("El slot de fusión seleccionado no es válido.");
    const updatedDeck: IDeck = {
      playerId: deck.playerId,
      slots: deck.slots.map((slot) => ({ ...slot })),
      fusionSlots: deck.fusionSlots.map((slot) => ({ ...slot })),
    };
    updatedDeck.fusionSlots[input.slotIndex] = { ...targetSlot, cardId: null };
    await this.deckRepository.saveDeck(updatedDeck);
    return updatedDeck;
  }
}
