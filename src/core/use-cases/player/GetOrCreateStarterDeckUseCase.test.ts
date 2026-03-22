// src/core/use-cases/player/GetOrCreateStarterDeckUseCase.test.ts - Verifica seed idempotente del deck inicial usando plantilla persistida.
import { describe, expect, it } from "vitest";
import { ICollectionCard } from "@/core/entities/home/ICollectionCard";
import { IDeck } from "@/core/entities/home/IDeck";
import { ValidationError } from "@/core/errors/ValidationError";
import { ICardCollectionRepository } from "@/core/repositories/ICardCollectionRepository";
import { IDeckRepository } from "@/core/repositories/IDeckRepository";
import { IStarterDeckTemplateRepository } from "@/core/repositories/IStarterDeckTemplateRepository";
import { GetOrCreateStarterDeckUseCase } from "@/core/use-cases/player/GetOrCreateStarterDeckUseCase";

function createDeck(playerId: string, withCards = false): IDeck {
  return {
    playerId,
    slots: Array.from({ length: 20 }, (_, index) => ({ index, cardId: withCards ? "entity-a" : null })),
    fusionSlots: Array.from({ length: 2 }, (_, index) => ({ index, cardId: withCards ? "fusion-a" : null })),
  };
}

function createCollectionEntry(cardId: string, ownedCopies: number): ICollectionCard {
  return {
    ownedCopies,
    card: {
      id: cardId,
      name: cardId,
      description: cardId,
      type: "ENTITY",
      faction: "NEUTRAL",
      cost: 1,
      attack: 500,
      defense: 500,
    },
  };
}

class FakeDeckRepository implements IDeckRepository {
  constructor(private deck: IDeck) {}
  async getDeck(playerId: string): Promise<IDeck> {
    if (!playerId.trim()) throw new Error("playerId inválido en test");
    return this.deck;
  }
  async saveDeck(deck: IDeck): Promise<void> { this.deck = deck; }
  async getCollection(playerId: string): Promise<ICollectionCard[]> {
    if (!playerId.trim()) throw new Error("playerId inválido en test");
    return [];
  }
  currentDeck(): IDeck { return this.deck; }
}

class FakeCollectionRepository implements ICardCollectionRepository {
  constructor(private collection: ICollectionCard[]) {}
  public readonly addedCards: string[] = [];
  async getCollection(playerId: string): Promise<ICollectionCard[]> {
    if (!playerId.trim()) throw new Error("playerId inválido en test");
    return this.collection;
  }
  async addCards(playerId: string, cardIds: string[]): Promise<void> {
    if (!playerId.trim()) throw new Error("playerId inválido en test");
    this.addedCards.push(...cardIds);
  }
  async consumeCards(playerId: string, cardId: string, copies: number): Promise<void> {
    if (!playerId.trim() || !cardId.trim() || copies <= 0) throw new Error("input inválido en test");
  }
}

class FakeStarterTemplateRepository implements IStarterDeckTemplateRepository {
  constructor(private readonly cardIds: string[]) {}
  async getActiveStarterDeckCardIds(templateKey: string): Promise<string[]> {
    if (!templateKey.trim()) throw new Error("templateKey inválido en test");
    return this.cardIds;
  }
}

describe("GetOrCreateStarterDeckUseCase", () => {
  it("seed inicial con plantilla y fusion vacía cuando deck está vacío", async () => {
    const templateCards = Array.from({ length: 20 }, (_, index) => `starter-${index}`);
    const deckRepository = new FakeDeckRepository(createDeck("p1"));
    const collectionRepository = new FakeCollectionRepository([]);
    const templateRepository = new FakeStarterTemplateRepository(templateCards);
    const useCase = new GetOrCreateStarterDeckUseCase(deckRepository, collectionRepository, templateRepository);
    const result = await useCase.execute({ playerId: "p1" });
    expect(result.seeded).toBe(true);
    expect(deckRepository.currentDeck().slots.map((slot) => slot.cardId)).toEqual(templateCards);
    expect(deckRepository.currentDeck().fusionSlots.every((slot) => slot.cardId === null)).toBe(true);
    expect(collectionRepository.addedCards).toEqual(templateCards);
  });

  it("no sobrescribe deck existente", async () => {
    const existingDeck = createDeck("p1", true);
    const deckRepository = new FakeDeckRepository(existingDeck);
    const collectionRepository = new FakeCollectionRepository([createCollectionEntry("entity-a", 3)]);
    const templateRepository = new FakeStarterTemplateRepository(Array.from({ length: 20 }, (_, index) => `starter-${index}`));
    const useCase = new GetOrCreateStarterDeckUseCase(deckRepository, collectionRepository, templateRepository);
    const result = await useCase.execute({ playerId: "p1" });
    expect(result.seeded).toBe(false);
    expect(deckRepository.currentDeck()).toEqual(existingDeck);
    expect(collectionRepository.addedCards).toHaveLength(0);
  });

  it("tolera carrera cuando addCards falla pero el estado final ya contiene el starter", async () => {
    const templateCards = Array.from({ length: 20 }, (_, index) => `starter-${index}`);
    const deckRepository = new FakeDeckRepository(createDeck("p1"));
    const collectionRepository = new FakeCollectionRepository([]);
    let addFailed = false;
    collectionRepository.addCards = async () => {
      addFailed = true;
      throw new ValidationError("Fallo transitorio por inserción concurrente.");
    };
    collectionRepository.getCollection = async () => {
      if (!addFailed) return [];
      return templateCards.map((cardId) => createCollectionEntry(cardId, 1));
    };
    const templateRepository = new FakeStarterTemplateRepository(templateCards);
    const useCase = new GetOrCreateStarterDeckUseCase(deckRepository, collectionRepository, templateRepository);

    const result = await useCase.execute({ playerId: "p1" });

    expect(result.seeded).toBe(true);
    expect(deckRepository.currentDeck().slots.map((slot) => slot.cardId)).toEqual(templateCards);
  });
});
