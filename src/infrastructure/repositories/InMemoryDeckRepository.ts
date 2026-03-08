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
import { HOME_DECK_SIZE, HOME_FUSION_DECK_SIZE } from "@/core/services/home/deck-rules";
import { InMemoryPlayerPersistenceStore } from "@/infrastructure/repositories/state/InMemoryPlayerPersistenceStore";
import { IPlayerPersistenceStore } from "@/infrastructure/repositories/state/IPlayerPersistenceStore";

const STARTER_COLLECTION = [...ENTITY_CARDS, ...EXECUTION_CARDS, ...TRAP_CARDS, ...FUSION_CARDS].map((card) => ({
  card,
  ownedCopies: 3,
}));

function createEmptyDeck(playerId: string): IDeck {
  const slots = Array.from({ length: HOME_DECK_SIZE }, (_, index) => ({ index, cardId: null }));
  const fusionSlots = Array.from({ length: HOME_FUSION_DECK_SIZE }, (_, index) => ({ index, cardId: null }));
  return { playerId, slots, fusionSlots };
}

export class InMemoryDeckRepository implements IDeckRepository {
  private readonly store: IPlayerPersistenceStore;

  constructor(
    private readonly collection: ICollectionCard[] = STARTER_COLLECTION,
    initialDecks: IDeck[] = [],
    private readonly collectionRepository: ICardCollectionRepository | null = null,
    store: IPlayerPersistenceStore = new InMemoryPlayerPersistenceStore(),
  ) {
    this.store = store;
    for (const deck of initialDecks) {
      if (!this.store.getDeck(deck.playerId)) {
        this.store.saveDeck(deck);
      }
    }
  }

  async getDeck(playerId: string): Promise<IDeck> {
    const currentDeck = this.store.getDeck(playerId) ?? createEmptyDeck(playerId);
    this.store.saveDeck(currentDeck);
    return {
      playerId: currentDeck.playerId,
      slots: currentDeck.slots.map((slot) => ({ ...slot })),
      fusionSlots: currentDeck.fusionSlots.map((slot) => ({ ...slot })),
    };
  }

  async saveDeck(deck: IDeck): Promise<void> {
    this.store.saveDeck(deck);
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
