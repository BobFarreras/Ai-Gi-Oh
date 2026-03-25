// src/core/use-cases/admin/SaveAdminStoryDeckUseCase.test.ts - Garantiza guardado de deck Story admin con validación previa.
import { describe, expect, it, vi } from "vitest";
import { IAdminStoryDeckRepository } from "@/core/repositories/admin/IAdminStoryDeckRepository";
import { SaveAdminStoryDeckUseCase } from "@/core/use-cases/admin/SaveAdminStoryDeckUseCase";

function createRepositoryMock(): IAdminStoryDeckRepository {
  return {
    listOpponents: vi.fn(),
    listDeckSummaries: vi.fn(),
    listDuelReferences: vi.fn(),
    getDeck: vi.fn(),
    saveDeck: vi.fn(async () => undefined),
    listAvailableCards: vi.fn(),
  };
}

describe("SaveAdminStoryDeckUseCase", () => {
  it("persiste deck cuando comando es válido", async () => {
    const repository = createRepositoryMock();
    const useCase = new SaveAdminStoryDeckUseCase(repository);
    await useCase.execute({ deckListId: "deck-1", cardIds: ["card-1", "card-2"] });
    expect(repository.saveDeck).toHaveBeenCalledWith("deck-1", ["card-1", "card-2"]);
  });
});

