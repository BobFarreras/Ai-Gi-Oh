// src/core/use-cases/home/GetHomeDeckBuilderDataUseCase.test.ts - Verifica la carga inicial de deck y almacén para Mi Home.
import { describe, expect, it } from "vitest";
import { InMemoryDeckRepository } from "@/infrastructure/repositories/InMemoryDeckRepository";
import { GetHomeDeckBuilderDataUseCase } from "./GetHomeDeckBuilderDataUseCase";

describe("GetHomeDeckBuilderDataUseCase", () => {
  it("carga deck vacío de 20 slots y colección inicial", async () => {
    const repository = new InMemoryDeckRepository();
    const useCase = new GetHomeDeckBuilderDataUseCase(repository);

    const result = await useCase.execute("player-a");

    expect(result.deck.slots).toHaveLength(20);
    expect(result.collection.length).toBeGreaterThan(0);
  });
});
