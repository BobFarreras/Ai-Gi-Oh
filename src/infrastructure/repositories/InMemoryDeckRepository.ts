// src/infrastructure/repositories/InMemoryDeckRepository.ts - Repositorio en memoria para colección y deck del módulo Mi Home.
import { ENTITY_CARDS } from "@/core/data/mock-cards/entities";
import { EXECUTION_CARDS } from "@/core/data/mock-cards/executions";
import { FUSION_CARDS } from "@/core/data/mock-cards/fusions";
import { TRAP_CARDS } from "@/core/data/mock-cards/traps";
import { ICollectionCard } from "@/core/entities/home/ICollectionCard";
import { IDeck } from "@/core/entities/home/IDeck";
import { NotFoundError } from "@/core/errors/NotFoundError";
import { ICardCollectionRepository } from "@/core/repositories/ICardCollectionRepository";
import { IDeckRepository } from "@/core/repositories/IDeckRepository";
import { HOME_DECK_SIZE } from "@/core/services/home/deck-rules";

const STARTER_COLLECTION = [...ENTITY_CARDS, ...EXECUTION_CARDS, ...TRAP_CARDS, ...FUSION_CARDS].map((card) => ({
  card,
  ownedCopies: 3,
}));

function createEmptyDeck(playerId: string): IDeck {
  const slots = Array.from({ length: HOME_DECK_SIZE }, (_, index) => ({ index, cardId: null }));
  return { playerId, slots };
}

export class InMemoryDeckRepository implements IDeckRepository {
  private readonly decks = new Map<string, IDeck>();

  constructor(
    private readonly collection: ICollectionCard[] = STARTER_COLLECTION,
    initialDecks: IDeck[] = [],
    private readonly collectionRepository: ICardCollectionRepository | null = null,
  ) {
    for (const deck of initialDecks) {
      this.decks.set(deck.playerId, { playerId: deck.playerId, slots: deck.slots.map((slot) => ({ ...slot })) });
    }
  }

  async getDeck(playerId: string): Promise<IDeck> {
    const currentDeck = this.decks.get(playerId) ?? createEmptyDeck(playerId);
    this.decks.set(playerId, currentDeck);
    return { playerId: currentDeck.playerId, slots: currentDeck.slots.map((slot) => ({ ...slot })) };
  }

  async saveDeck(deck: IDeck): Promise<void> {
    this.decks.set(deck.playerId, { playerId: deck.playerId, slots: deck.slots.map((slot) => ({ ...slot })) });
  }

  async getCollection(playerId: string): Promise<ICollectionCard[]> {
    if (!playerId.trim()) {
      throw new NotFoundError("No se encontró colección para jugador vacío.");
    }

    if (this.collectionRepository) {
      return this.collectionRepository.getCollection(playerId);
    }

    return this.collection.map((entry) => ({ card: entry.card, ownedCopies: entry.ownedCopies }));
  }
}
