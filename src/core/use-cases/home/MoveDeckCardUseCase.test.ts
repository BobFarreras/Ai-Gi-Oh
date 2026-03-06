// src/core/use-cases/home/MoveDeckCardUseCase.test.ts - Asegura el intercambio de posiciones entre cartas del deck.
import { describe, expect, it } from "vitest";
import { InMemoryDeckRepository } from "@/infrastructure/repositories/InMemoryDeckRepository";
import { AddCardToDeckUseCase } from "./AddCardToDeckUseCase";
import { MoveDeckCardUseCase } from "./MoveDeckCardUseCase";

describe("MoveDeckCardUseCase", () => {
  it("intercambia cartas entre dos slots", async () => {
    const repository = new InMemoryDeckRepository();
    const addCardUseCase = new AddCardToDeckUseCase(repository);
    const moveDeckCardUseCase = new MoveDeckCardUseCase(repository);
    await addCardUseCase.execute({ playerId: "player-a", cardId: "entity-python" });
    await addCardUseCase.execute({ playerId: "player-a", cardId: "entity-react" });

    const deck = await moveDeckCardUseCase.execute({ playerId: "player-a", fromSlotIndex: 0, toSlotIndex: 1 });
    expect(deck.slots[0].cardId).toBe("entity-react");
    expect(deck.slots[1].cardId).toBe("entity-python");
  });
});
