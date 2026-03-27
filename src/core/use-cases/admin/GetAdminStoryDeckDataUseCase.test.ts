// src/core/use-cases/admin/GetAdminStoryDeckDataUseCase.test.ts - Verifica selección de oponente/deck en agregado de datos Story Deck admin.
import { describe, expect, it, vi } from "vitest";
import { IAdminStoryDeckRepository } from "@/core/repositories/admin/IAdminStoryDeckRepository";
import { GetAdminStoryDeckDataUseCase } from "@/core/use-cases/admin/GetAdminStoryDeckDataUseCase";

function createRepositoryMock(): IAdminStoryDeckRepository {
  return {
    listOpponents: vi.fn(async () => [{ opponentId: "opp-1", displayName: "Opp", avatarUrl: null, difficulty: "ROOKIE" as const, deckCount: 1, duelCount: 1 }]),
    listDeckSummaries: vi.fn(async () => [{ deckListId: "deck-1", opponentId: "opp-1", name: "Deck", version: 1, isActive: true }]),
    listDuelReferences: vi.fn(async () => [{ duelId: "duel-1", chapter: 1, duelIndex: 1, title: "Duel", deckListId: "deck-1" }]),
    listDuelAiProfiles: vi.fn(async () => [{ duelId: "duel-1", difficulty: "ROOKIE" as const, aiProfile: { style: "balanced" as const, aggression: 0.41 }, isActive: true }]),
    listDuelDeckOverrides: vi.fn(async () => []),
    getDeck: vi.fn(async () => ({ deckListId: "deck-1", opponentId: "opp-1", name: "Deck", description: null, version: 1, isActive: true, slots: [] })),
    saveDeck: vi.fn(),
    listAvailableCards: vi.fn(),
  };
}

describe("GetAdminStoryDeckDataUseCase", () => {
  it("carga deck activo por defecto", async () => {
    const repository = createRepositoryMock();
    const useCase = new GetAdminStoryDeckDataUseCase(repository);
    const data = await useCase.execute();
    expect(data.deck?.deckListId).toBe("deck-1");
    expect(data.duelAiProfiles).toHaveLength(1);
    expect(repository.getDeck).toHaveBeenCalledWith("deck-1");
  });

  it("filtra por oponente solicitado", async () => {
    const repository = createRepositoryMock();
    const useCase = new GetAdminStoryDeckDataUseCase(repository);
    const data = await useCase.execute({ opponentId: "opp-1" });
    expect(data.decks).toHaveLength(1);
    expect(data.duels).toHaveLength(1);
  });
});
