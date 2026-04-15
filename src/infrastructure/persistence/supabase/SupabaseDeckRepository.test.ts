// src/infrastructure/persistence/supabase/SupabaseDeckRepository.test.ts - Verifica reconciliación de colección cuando el deck persistido tiene cartas sin copias suficientes.
import { describe, expect, it, vi } from "vitest";
import { SupabaseDeckRepository } from "@/infrastructure/persistence/supabase/SupabaseDeckRepository";
import { ICardCollectionRepository } from "@/core/repositories/ICardCollectionRepository";
import { IDeck } from "@/core/entities/home/IDeck";
import { ICollectionCard } from "@/core/entities/home/ICollectionCard";
import { SupabaseClient } from "@supabase/supabase-js";

function buildCollectionEntry(cardId: string, ownedCopies: number): ICollectionCard {
  return {
    card: {
      id: cardId,
      name: `Card ${cardId}`,
      description: "Carta mock",
      type: "ENTITY",
      faction: "OPEN_SOURCE",
      cost: 1,
      attack: 100,
      defense: 100,
      renderUrl: "/mock.png",
    },
    ownedCopies,
  };
}

class TestableSupabaseDeckRepository extends SupabaseDeckRepository {
  constructor(collectionRepository: ICardCollectionRepository, private readonly mockedDeck: IDeck) {
    super({} as SupabaseClient, collectionRepository);
  }

  async getDeck(playerId: string): Promise<IDeck> {
    return { ...this.mockedDeck, playerId };
  }
}

describe("SupabaseDeckRepository", () => {
  it("reconcilia copias faltantes en colección cuando el deck ya tiene cartas asignadas", async () => {
    const getCollectionMock = vi
      .fn<() => Promise<ICollectionCard[]>>()
      .mockResolvedValueOnce([
        buildCollectionEntry("card-a", 1),
        buildCollectionEntry("card-b", 1),
      ])
      .mockResolvedValueOnce([
        buildCollectionEntry("card-a", 2),
        buildCollectionEntry("card-b", 1),
      ]);
    const addCardsMock = vi.fn<() => Promise<void>>().mockResolvedValue();
    const collectionRepository = {
      getCollection: getCollectionMock,
      addCards: addCardsMock,
      consumeCards: vi.fn(),
    } as unknown as ICardCollectionRepository;
    const deck: IDeck = {
      playerId: "p1",
      slots: [
        { index: 0, cardId: "card-a" },
        { index: 1, cardId: "card-a" },
        { index: 2, cardId: "card-b" },
        ...Array.from({ length: 17 }, (_, offset) => ({ index: offset + 3, cardId: null })),
      ],
      fusionSlots: [
        { index: 0, cardId: null },
        { index: 1, cardId: null },
      ],
    };
    const repository = new TestableSupabaseDeckRepository(collectionRepository, deck);

    const collection = await repository.getCollection("p1");

    expect(addCardsMock).toHaveBeenCalledWith("p1", ["card-a"]);
    expect(collection.find((entry) => entry.card.id === "card-a")?.ownedCopies).toBe(2);
  });
});
