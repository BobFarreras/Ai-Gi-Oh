// src/infrastructure/repositories/InMemoryCardCollectionRepository.ts - Repositorio mock de colección para integrar compras de mercado con Mi Home.
import { ENTITY_CARDS } from "@/core/data/mock-cards/entities";
import { EXECUTION_CARDS } from "@/core/data/mock-cards/executions";
import { FUSION_CARDS } from "@/core/data/mock-cards/fusions";
import { TRAP_CARDS } from "@/core/data/mock-cards/traps";
import { ICollectionCard } from "@/core/entities/home/ICollectionCard";
import { ValidationError } from "@/core/errors/ValidationError";
import { NotFoundError } from "@/core/errors/NotFoundError";
import { ICardCollectionRepository } from "@/core/repositories/ICardCollectionRepository";
import { InMemoryPlayerPersistenceStore } from "@/infrastructure/repositories/state/InMemoryPlayerPersistenceStore";
import { IPlayerPersistenceStore } from "@/infrastructure/repositories/state/IPlayerPersistenceStore";

const CARD_CATALOG = [...ENTITY_CARDS, ...EXECUTION_CARDS, ...TRAP_CARDS, ...FUSION_CARDS];
const CARD_BY_ID = new Map(CARD_CATALOG.map((card) => [card.id, card]));

export class InMemoryCardCollectionRepository implements ICardCollectionRepository {
  private readonly store: IPlayerPersistenceStore;

  constructor(initialPlayerId = "local-player", store: IPlayerPersistenceStore = new InMemoryPlayerPersistenceStore()) {
    this.store = store;
    const existingCollection = this.store.getCollectionCounts(initialPlayerId);
    if (!existingCollection) {
      const starterCollection = new Map<string, number>();
      for (const card of ENTITY_CARDS.slice(0, 10)) {
        starterCollection.set(card.id, 1);
      }
      this.store.saveCollectionCounts(initialPlayerId, starterCollection);
    }
  }

  async getCollection(playerId: string): Promise<ICollectionCard[]> {
    const collectionMap = this.store.getCollectionCounts(playerId) ?? new Map<string, number>();
    this.store.saveCollectionCounts(playerId, collectionMap);
    return Array.from(collectionMap.entries())
      .map(([cardId, ownedCopies]) => {
        const card = CARD_BY_ID.get(cardId);
        if (!card) return null;
        return { card, ownedCopies };
      })
      .filter((entry): entry is ICollectionCard => entry !== null);
  }

  async addCards(playerId: string, cardIds: string[]): Promise<void> {
    const collectionMap = this.store.getCollectionCounts(playerId) ?? new Map<string, number>();
    for (const cardId of cardIds) {
      if (!CARD_BY_ID.has(cardId)) {
        throw new NotFoundError(`La carta ${cardId} no existe en el catálogo de mercado.`);
      }
      collectionMap.set(cardId, (collectionMap.get(cardId) ?? 0) + 1);
    }
    this.store.saveCollectionCounts(playerId, collectionMap);
  }

  async consumeCards(playerId: string, cardId: string, copies: number): Promise<void> {
    if (!Number.isInteger(copies) || copies <= 0) throw new ValidationError("La cantidad a consumir debe ser positiva.");
    const collectionMap = this.store.getCollectionCounts(playerId) ?? new Map<string, number>();
    const ownedCopies = collectionMap.get(cardId) ?? 0;
    if (ownedCopies < copies) throw new ValidationError("No hay suficientes copias en el almacén para evolucionar.");
    const nextCopies = ownedCopies - copies;
    if (nextCopies === 0) collectionMap.delete(cardId);
    else collectionMap.set(cardId, nextCopies);
    this.store.saveCollectionCounts(playerId, collectionMap);
  }
}
