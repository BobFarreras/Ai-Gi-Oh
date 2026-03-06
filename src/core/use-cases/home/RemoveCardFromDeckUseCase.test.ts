// src/core/use-cases/home/RemoveCardFromDeckUseCase.test.ts - Verifica eliminación de cartas desde slots concretos del deck.
import { describe, expect, it } from "vitest";
import { InMemoryDeckRepository } from "@/infrastructure/repositories/InMemoryDeckRepository";
import { AddCardToDeckUseCase } from "./AddCardToDeckUseCase";
import { RemoveCardFromDeckUseCase } from "./RemoveCardFromDeckUseCase";

describe("RemoveCardFromDeckUseCase", () => {
  it("elimina la carta del slot indicado", async () => {
    const repository = new InMemoryDeckRepository();
    const addCardUseCase = new AddCardToDeckUseCase(repository);
    const removeCardUseCase = new RemoveCardFromDeckUseCase(repository);
    await addCardUseCase.execute({ playerId: "player-a", cardId: "entity-python" });

    const deck = await removeCardUseCase.execute({ playerId: "player-a", slotIndex: 0 });
    expect(deck.slots[0].cardId).toBeNull();
  });
});
