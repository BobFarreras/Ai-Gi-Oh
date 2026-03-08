// src/core/use-cases/home/AddCardToFusionDeckUseCase.test.ts - Valida reglas de inserción en slots dedicados de fusión.
import { describe, expect, it } from "vitest";
import { IDeck } from "@/core/entities/home/IDeck";
import { ICollectionCard } from "@/core/entities/home/ICollectionCard";
import { IDeckRepository } from "@/core/repositories/IDeckRepository";
import { AddCardToFusionDeckUseCase } from "./AddCardToFusionDeckUseCase";

class FakeDeckRepository implements IDeckRepository {
  constructor(private deck: IDeck, private readonly collection: ICollectionCard[]) {}
  async getDeck(playerId: string): Promise<IDeck> { void playerId; return this.deck; }
  async saveDeck(deck: IDeck): Promise<void> { this.deck = deck; }
  async getCollection(playerId: string): Promise<ICollectionCard[]> { void playerId; return this.collection; }
}

function createDeck(): IDeck {
  return {
    playerId: "p1",
    slots: Array.from({ length: 20 }, (_, index) => ({ index, cardId: null })),
    fusionSlots: [{ index: 0, cardId: null }, { index: 1, cardId: null }],
  };
}

describe("AddCardToFusionDeckUseCase", () => {
  it("equipa una carta FUSION en un slot válido", async () => {
    const repo = new FakeDeckRepository(createDeck(), [
      { card: { id: "fusion-gemgpt", name: "GemGPT", description: "", type: "FUSION", faction: "NEUTRAL", cost: 8 }, ownedCopies: 1 },
    ]);
    const useCase = new AddCardToFusionDeckUseCase(repo);
    const updated = await useCase.execute({ playerId: "p1", cardId: "fusion-gemgpt", slotIndex: 0 });
    expect(updated.fusionSlots[0].cardId).toBe("fusion-gemgpt");
  });

  it("rechaza cartas que no son FUSION", async () => {
    const repo = new FakeDeckRepository(createDeck(), [
      { card: { id: "entity-python", name: "Python", description: "", type: "ENTITY", faction: "NEUTRAL", cost: 2, attack: 1200, defense: 900 }, ownedCopies: 2 },
    ]);
    const useCase = new AddCardToFusionDeckUseCase(repo);
    await expect(useCase.execute({ playerId: "p1", cardId: "entity-python", slotIndex: 0 })).rejects.toThrow("tipo FUSION");
  });
});
