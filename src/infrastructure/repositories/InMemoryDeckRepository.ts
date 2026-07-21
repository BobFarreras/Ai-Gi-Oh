// src/infrastructure/repositories/InMemoryDeckRepository.ts - Repositorio en memoria para colección y deck del módulo Mi Home.
import { ENTITY_CARDS } from "@/core/data/mock-cards/entities";
import { EXECUTION_CARDS } from "@/core/data/mock-cards/executions";
import { FUSION_CARDS } from "@/core/data/mock-cards/fusions";
import { TRAP_CARDS } from "@/core/data/mock-cards/traps";
import { ICollectionCard } from "@/core/entities/home/ICollectionCard";
import { IDeck, IDeckSwapResult } from "@/core/entities/home/IDeck";
import { NotFoundError } from "@/core/errors/NotFoundError";
import { ICardCollectionRepository } from "@/core/repositories/ICardCollectionRepository";
import { IDeckRepository, ISwapActiveDeckCommand } from "@/core/repositories/IDeckRepository";
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
  /** Doble Arsenal: 2º mazo (banco) en memoria por jugador. */
  private readonly bankDecks = new Map<string, IDeck>();

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

  async getBankDeck(playerId: string): Promise<IDeck> {
    const existing = this.bankDecks.get(playerId);
    if (existing) {
      return { playerId, slots: existing.slots.map((s) => ({ ...s })), fusionSlots: existing.fusionSlots.map((s) => ({ ...s })) };
    }
    // Bootstrap: 2º mazo VACÍO (el jugador aún no lo ha construido).
    const empty = createEmptyDeck(playerId);
    this.bankDecks.set(playerId, empty);
    return { playerId, slots: empty.slots.map((s) => ({ ...s })), fusionSlots: empty.fusionSlots.map((s) => ({ ...s })) };
  }

  async saveBankDeck(deck: IDeck): Promise<void> {
    this.bankDecks.set(deck.playerId, { playerId: deck.playerId, slots: deck.slots.map((s) => ({ ...s })), fusionSlots: deck.fusionSlots.map((s) => ({ ...s })) });
  }

  async swapActiveDeck(command: ISwapActiveDeckCommand): Promise<IDeckSwapResult> {
    const active = await this.getDeck(command.playerId);
    const bank = await this.getBankDeck(command.playerId);
    this.store.saveDeck({ ...bank, playerId: command.playerId });
    this.bankDecks.set(command.playerId, { ...active, playerId: command.playerId });
    return { ok: true };
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
