// src/core/use-cases/home/EvolveCardVersionUseCase.test.ts - Verifica evolución de versión usando copias del almacén y progreso persistente.
import { describe, expect, it } from "vitest";
import { ICardCollectionRepository } from "@/core/repositories/ICardCollectionRepository";
import { IPlayerCardProgressRepository } from "@/core/repositories/IPlayerCardProgressRepository";
import { InMemoryCardCollectionRepository } from "@/infrastructure/repositories/InMemoryCardCollectionRepository";
import { InMemoryDeckRepository } from "@/infrastructure/repositories/InMemoryDeckRepository";
import { EvolveCardVersionUseCase } from "@/core/use-cases/home/EvolveCardVersionUseCase";
import { IPlayerCardProgress } from "@/core/entities/progression/IPlayerCardProgress";
import { AddCardToDeckUseCase } from "@/core/use-cases/home/AddCardToDeckUseCase";

class InMemoryPlayerCardProgressRepository implements IPlayerCardProgressRepository {
  private readonly rows = new Map<string, IPlayerCardProgress>();

  async getByPlayerAndCard(playerId: string, cardId: string): Promise<IPlayerCardProgress | null> {
    return this.rows.get(`${playerId}:${cardId}`) ?? null;
  }

  async listByPlayer(playerId: string): Promise<IPlayerCardProgress[]> {
    return Array.from(this.rows.values()).filter((row) => row.playerId === playerId);
  }

  async upsert(input: { playerId: string; cardId: string; versionTier?: number; level?: number; xp?: number; masteryPassiveSkillId?: string | null }): Promise<IPlayerCardProgress> {
    const current = (await this.getByPlayerAndCard(input.playerId, input.cardId)) ?? {
      playerId: input.playerId,
      cardId: input.cardId,
      versionTier: 0,
      level: 0,
      xp: 0,
      masteryPassiveSkillId: null,
      updatedAtIso: new Date().toISOString(),
    };
    const updated: IPlayerCardProgress = {
      ...current,
      versionTier: input.versionTier ?? current.versionTier,
      level: input.level ?? current.level,
      xp: input.xp ?? current.xp,
      masteryPassiveSkillId: input.masteryPassiveSkillId ?? current.masteryPassiveSkillId,
      updatedAtIso: new Date().toISOString(),
    };
    this.rows.set(`${input.playerId}:${input.cardId}`, updated);
    return updated;
  }
}

describe("EvolveCardVersionUseCase", () => {
  it("sube versión y consume copias del almacén", async () => {
    const collectionRepository: ICardCollectionRepository = new InMemoryCardCollectionRepository("player-a");
    const deckRepository = new InMemoryDeckRepository([], [], collectionRepository);
    await collectionRepository.addCards("player-a", ["entity-python", "entity-python", "entity-python", "entity-python"]);
    const progressRepository: IPlayerCardProgressRepository = new InMemoryPlayerCardProgressRepository();
    const useCase = new EvolveCardVersionUseCase(collectionRepository, deckRepository, progressRepository);
    const result = await useCase.execute({ playerId: "player-a", cardId: "entity-python" });
    expect(result.progress.versionTier).toBe(1);
    expect(result.consumedCopies).toBe(4);
  });

  it("bloquea evolución si faltan copias", async () => {
    const collectionRepository: ICardCollectionRepository = new InMemoryCardCollectionRepository("player-b");
    const deckRepository = new InMemoryDeckRepository([], [], collectionRepository);
    await collectionRepository.addCards("player-b", ["entity-vscode", "entity-vscode", "entity-vscode"]);
    const progressRepository: IPlayerCardProgressRepository = new InMemoryPlayerCardProgressRepository();
    const useCase = new EvolveCardVersionUseCase(collectionRepository, deckRepository, progressRepository);
    await expect(useCase.execute({ playerId: "player-b", cardId: "entity-vscode" })).rejects.toThrow("Se necesitan 4 copias libres");
  });

  it("bloquea evolución si las copias están ocupadas en el deck", async () => {
    const collectionRepository: ICardCollectionRepository = new InMemoryCardCollectionRepository("player-c");
    const deckRepository = new InMemoryDeckRepository([], [], collectionRepository);
    const addCardUseCase = new AddCardToDeckUseCase(deckRepository);
    await collectionRepository.addCards("player-c", ["entity-python", "entity-python", "entity-python"]);
    await addCardUseCase.execute({ playerId: "player-c", cardId: "entity-python" });
    const progressRepository: IPlayerCardProgressRepository = new InMemoryPlayerCardProgressRepository();
    const useCase = new EvolveCardVersionUseCase(collectionRepository, deckRepository, progressRepository);
    await expect(useCase.execute({ playerId: "player-c", cardId: "entity-python" })).rejects.toThrow("Se necesitan 4 copias libres");
  });
});
