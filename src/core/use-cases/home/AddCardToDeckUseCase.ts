// src/core/use-cases/home/AddCardToDeckUseCase.ts - Añade una carta al primer slot libre cumpliendo reglas del deck.
import { IDeck } from "@/core/entities/home/IDeck";
import { GameRuleError } from "@/core/errors/GameRuleError";
import { IDeckRepository } from "@/core/repositories/IDeckRepository";
import { assertCanAddCardToDeck, countAssignedCopies, findFirstEmptyDeckSlot } from "@/core/services/home/deck-rules";
import { assertValidCardId, assertValidPlayerId } from "@/core/use-cases/home/internal/assert-valid-home-input";

interface IAddCardToDeckInput {
  playerId: string;
  cardId: string;
  slotIndex?: number;
}

export class AddCardToDeckUseCase {
  constructor(private readonly deckRepository: IDeckRepository) {}

  async execute(input: IAddCardToDeckInput): Promise<IDeck> {
    assertValidPlayerId(input.playerId);
    assertValidCardId(input.cardId);
    const [deck, collection] = await Promise.all([
      this.deckRepository.getDeck(input.playerId),
      this.deckRepository.getCollection(input.playerId),
    ]);
    const collectionEntry = collection.find((entry) => entry.card.id === input.cardId);
    if (!collectionEntry) {
      throw new GameRuleError("La carta no existe en el almacén del jugador.");
    }
    if (collectionEntry.card.type === "FUSION") {
      throw new GameRuleError("Las cartas de fusión solo pueden equiparse en el bloque de fusión.");
    }

    assertCanAddCardToDeck(deck, input.cardId);
    if (countAssignedCopies(deck, input.cardId) >= collectionEntry.ownedCopies) {
      throw new GameRuleError("No tienes más copias disponibles de esta carta.");
    }
    const slotIndex = input.slotIndex ?? findFirstEmptyDeckSlot(deck);
    const targetSlot = deck.slots[slotIndex];
    if (!targetSlot) {
      throw new GameRuleError("El slot de destino no es válido.");
    }
    if (targetSlot.cardId !== null) {
      throw new GameRuleError("El slot de destino ya está ocupado.");
    }
    const updatedDeck: IDeck = {
      playerId: deck.playerId,
      slots: deck.slots.map((slot) => ({ ...slot })),
      fusionSlots: deck.fusionSlots.map((slot) => ({ ...slot })),
    };
    updatedDeck.slots[slotIndex] = { ...updatedDeck.slots[slotIndex], cardId: input.cardId };
    await this.deckRepository.saveDeck(updatedDeck);
    return updatedDeck;
  }
}
