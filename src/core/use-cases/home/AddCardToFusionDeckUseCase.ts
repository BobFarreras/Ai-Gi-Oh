// src/core/use-cases/home/AddCardToFusionDeckUseCase.ts - Añade una carta de tipo fusión a un slot dedicado del bloque de fusión.
import { IDeck } from "@/core/entities/home/IDeck";
import { GameRuleError } from "@/core/errors/GameRuleError";
import { ValidationError } from "@/core/errors/ValidationError";
import { IDeckRepository } from "@/core/repositories/IDeckRepository";
import { countAssignedCopies } from "@/core/services/home/deck-rules";
import { assertValidCardId, assertValidPlayerId } from "@/core/use-cases/home/internal/assert-valid-home-input";

interface IAddCardToFusionDeckInput {
  playerId: string;
  cardId: string;
  slotIndex: number;
}

export class AddCardToFusionDeckUseCase {
  constructor(private readonly deckRepository: IDeckRepository) {}

  async execute(input: IAddCardToFusionDeckInput): Promise<IDeck> {
    assertValidPlayerId(input.playerId);
    assertValidCardId(input.cardId);
    const [deck, collection] = await Promise.all([this.deckRepository.getDeck(input.playerId), this.deckRepository.getCollection(input.playerId)]);
    const collectionEntry = collection.find((entry) => entry.card.id === input.cardId);
    if (!collectionEntry) throw new GameRuleError("La carta no existe en el almacén del jugador.");
    if (collectionEntry.card.type !== "FUSION") throw new ValidationError("Solo puedes equipar cartas de tipo FUSION en este bloque.");
    const targetSlot = deck.fusionSlots[input.slotIndex];
    if (!targetSlot) throw new ValidationError("El slot de fusión seleccionado no es válido.");
    if (countAssignedCopies(deck, input.cardId) >= collectionEntry.ownedCopies) throw new GameRuleError("No tienes más copias disponibles de esta carta.");
    const updatedDeck: IDeck = {
      playerId: deck.playerId,
      slots: deck.slots.map((slot) => ({ ...slot })),
      fusionSlots: deck.fusionSlots.map((slot) => ({ ...slot })),
    };
    updatedDeck.fusionSlots[input.slotIndex] = { ...targetSlot, cardId: input.cardId };
    await this.deckRepository.saveDeck(updatedDeck);
    return updatedDeck;
  }
}
