// src/core/use-cases/home/AddCardToDeckUseCase.test.ts - Valida alta de cartas y límite de 3 copias en el deck.
import { describe, expect, it } from "vitest";
import { InMemoryDeckRepository } from "@/infrastructure/repositories/InMemoryDeckRepository";
import { AddCardToDeckUseCase } from "./AddCardToDeckUseCase";

describe("AddCardToDeckUseCase", () => {
  it("añade una carta en el primer slot libre", async () => {
    const repository = new InMemoryDeckRepository();
    const useCase = new AddCardToDeckUseCase(repository);

    const deck = await useCase.execute({ playerId: "player-a", cardId: "entity-python" });
    expect(deck.slots[0].cardId).toBe("entity-python");
  });

  it("bloquea una cuarta copia de la misma carta", async () => {
    const repository = new InMemoryDeckRepository();
    const useCase = new AddCardToDeckUseCase(repository);
    await useCase.execute({ playerId: "player-a", cardId: "entity-python" });
    await useCase.execute({ playerId: "player-a", cardId: "entity-python" });
    await useCase.execute({ playerId: "player-a", cardId: "entity-python" });

    await expect(useCase.execute({ playerId: "player-a", cardId: "entity-python" })).rejects.toThrow(
      "No se permiten más de 3 copias",
    );
  });
});
