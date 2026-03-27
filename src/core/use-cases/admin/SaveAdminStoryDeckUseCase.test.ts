// src/core/use-cases/admin/SaveAdminStoryDeckUseCase.test.ts - Garantiza guardado de deck Story admin con validación previa.
import { describe, expect, it, vi } from "vitest";
import { IAdminStoryDeckRepository } from "@/core/repositories/admin/IAdminStoryDeckRepository";
import { SaveAdminStoryDeckUseCase } from "@/core/use-cases/admin/SaveAdminStoryDeckUseCase";

function createRepositoryMock(): IAdminStoryDeckRepository {
  return {
    listOpponents: vi.fn(),
    listDeckSummaries: vi.fn(),
    listDuelReferences: vi.fn(),
    listDuelAiProfiles: vi.fn(),
    listDuelDeckOverrides: vi.fn(),
    getDeck: vi.fn(),
    saveDeck: vi.fn(async () => undefined),
    listAvailableCards: vi.fn(),
  };
}

describe("SaveAdminStoryDeckUseCase", () => {
  it("persiste deck cuando comando es válido", async () => {
    const repository = createRepositoryMock();
    const useCase = new SaveAdminStoryDeckUseCase(repository);
    await useCase.execute({ deckListId: "deck-1", cardIds: ["card-1", "card-2"], duelConfig: null, updateBaseDeck: true });
    expect(repository.saveDeck).toHaveBeenCalledWith("deck-1", ["card-1", "card-2"], null, true);
  });

  it("permite guardar solo configuración de duelo sin tocar deck base", async () => {
    const repository = createRepositoryMock();
    const useCase = new SaveAdminStoryDeckUseCase(repository);
    await useCase.execute({
      deckListId: "deck-1",
      cardIds: [],
      updateBaseDeck: false,
      duelConfig: { duelId: "story-ch2-duel-7", difficulty: "ELITE", aiProfile: { style: "combo", aggression: 0.66 }, slotOverrides: [{ slotIndex: 0, cardId: "entity-python", versionTier: 2, level: 12, xp: 1400 }] },
    });
    expect(repository.saveDeck).toHaveBeenCalledWith("deck-1", [], expect.any(Object), false);
  });
});

