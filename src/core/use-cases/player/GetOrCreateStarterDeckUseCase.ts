// src/core/use-cases/player/GetOrCreateStarterDeckUseCase.ts - Garantiza deck inicial de 20 cartas básicas para jugadores sin mazo configurado.
import { IDeck } from "@/core/entities/home/IDeck";
import { ValidationError } from "@/core/errors/ValidationError";
import { ICardCollectionRepository } from "@/core/repositories/ICardCollectionRepository";
import { IDeckRepository } from "@/core/repositories/IDeckRepository";
import { IStarterDeckTemplateRepository } from "@/core/repositories/IStarterDeckTemplateRepository";
import { HOME_DECK_SIZE } from "@/core/services/home/deck-rules";

interface IGetOrCreateStarterDeckInput {
  playerId: string;
}

const STARTER_TEMPLATE_KEY = "academy-starter-v1";

function hasConfiguredDeck(deck: IDeck): boolean {
  return deck.slots.some((slot) => slot.cardId !== null);
}

/**
 * Inicializa un deck base solo cuando el jugador todavía no configuró ninguno.
 */
export class GetOrCreateStarterDeckUseCase {
  constructor(
    private readonly deckRepository: IDeckRepository,
    private readonly collectionRepository: ICardCollectionRepository,
    private readonly starterDeckTemplateRepository: IStarterDeckTemplateRepository,
  ) {}

  async execute(input: IGetOrCreateStarterDeckInput): Promise<{ seeded: boolean }> {
    if (!input.playerId.trim()) throw new ValidationError("El identificador del jugador es obligatorio.");
    const deck = await this.deckRepository.getDeck(input.playerId);
    if (hasConfiguredDeck(deck)) return { seeded: false };
    const starterCardIds = await this.starterDeckTemplateRepository.getActiveStarterDeckCardIds(STARTER_TEMPLATE_KEY);
    const nextDeck: IDeck = {
      ...deck,
      slots: deck.slots.map((slot, index) => ({ ...slot, cardId: starterCardIds[index] ?? null })),
      fusionSlots: deck.fusionSlots.map((slot) => ({ ...slot, cardId: null })),
    };
    if (nextDeck.slots.filter((slot) => slot.cardId !== null).length !== HOME_DECK_SIZE) {
      throw new ValidationError("No se pudo construir un deck inicial válido de 20 cartas.");
    }
    const collection = await this.collectionRepository.getCollection(input.playerId);
    const ownedCopiesByCardId = new Map(collection.map((entry) => [entry.card.id, entry.ownedCopies]));
    const missingStarterCards: string[] = [];
    for (const cardId of starterCardIds) {
      const currentCopies = ownedCopiesByCardId.get(cardId) ?? 0;
      if (currentCopies > 0) {
        ownedCopiesByCardId.set(cardId, currentCopies - 1);
        continue;
      }
      missingStarterCards.push(cardId);
    }
    if (missingStarterCards.length > 0) {
      await this.collectionRepository.addCards(input.playerId, missingStarterCards);
    }
    await this.deckRepository.saveDeck(nextDeck);
    return { seeded: true };
  }
}
