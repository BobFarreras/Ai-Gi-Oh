// src/core/use-cases/admin/GetAdminStoryDeckDataUseCase.ts - Resuelve catálogo de oponentes Story y mazo seleccionado para edición admin.
import { IAdminStoryDeckData } from "@/core/entities/admin/IAdminStoryDeck";
import { IAdminStoryDeckRepository } from "@/core/repositories/admin/IAdminStoryDeckRepository";

interface IGetAdminStoryDeckDataInput {
  opponentId?: string;
  deckListId?: string;
}

export class GetAdminStoryDeckDataUseCase {
  constructor(private readonly repository: IAdminStoryDeckRepository) {}

  async execute(input: IGetAdminStoryDeckDataInput = {}): Promise<IAdminStoryDeckData> {
    const [opponents, allDecks, allDuels] = await Promise.all([
      this.repository.listOpponents(),
      this.repository.listDeckSummaries(),
      this.repository.listDuelReferences(),
    ]);
    const targetOpponentId = input.opponentId ?? opponents[0]?.opponentId;
    const decks = targetOpponentId ? allDecks.filter((deck) => deck.opponentId === targetOpponentId) : allDecks;
    const duels = targetOpponentId ? allDuels.filter((duel) => allDecks.find((deck) => deck.deckListId === duel.deckListId)?.opponentId === targetOpponentId) : allDuels;
    const targetDeckListId = input.deckListId ?? decks.find((deck) => deck.isActive)?.deckListId ?? decks[0]?.deckListId;
    const duelIds = duels.map((duel) => duel.duelId);
    const [duelAiProfiles, duelDeckOverrides] = await Promise.all([
      this.repository.listDuelAiProfiles(duelIds),
      this.repository.listDuelDeckOverrides(duelIds),
    ]);
    return { opponents, decks, duels, duelAiProfiles, duelDeckOverrides, deck: targetDeckListId ? await this.repository.getDeck(targetDeckListId) : null };
  }
}

