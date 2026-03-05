// src/core/use-cases/progression/ApplyBattleCardExperienceUseCase.test.ts - Pruebas del caso de uso batch para persistir EXP de cartas tras combate.
import { describe, expect, it } from "vitest";
import { IPlayerCardProgress } from "@/core/entities/progression/IPlayerCardProgress";
import { IPlayerCardProgressRepository } from "@/core/repositories/IPlayerCardProgressRepository";
import { ApplyBattleCardExperienceUseCase } from "./ApplyBattleCardExperienceUseCase";

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

describe("ApplyBattleCardExperienceUseCase", () => {
  it("acumula eventos por carta y persiste una sola actualización por cardId", async () => {
    const repository = new InMemoryPlayerCardProgressRepository();
    const useCase = new ApplyBattleCardExperienceUseCase(repository);
    const result = await useCase.execute({
      playerId: "player-a",
      events: [
        { cardId: "entity-python", eventType: "SUMMON_SUCCESS" },
        { cardId: "entity-python", eventType: "DIRECT_HIT" },
        { cardId: "entity-react", eventType: "ACTIVATE_EFFECT" },
      ],
    });
    const python = result.find((entry) => entry.cardId === "entity-python");
    const react = result.find((entry) => entry.cardId === "entity-react");
    expect(python?.gainedXp).toBe(40);
    expect(react?.gainedXp).toBe(20);
    expect(result).toHaveLength(2);
  });

  it("sube de nivel cuando cruza umbral de XP", async () => {
    const repository = new InMemoryPlayerCardProgressRepository();
    await repository.upsert({ playerId: "player-b", cardId: "entity-python", xp: 990, level: 0, versionTier: 0 });
    const useCase = new ApplyBattleCardExperienceUseCase(repository);
    const result = await useCase.execute({
      playerId: "player-b",
      events: [{ cardId: "entity-python", eventType: "SUMMON_SUCCESS" }],
    });
    expect(result[0].oldLevel).toBe(0);
    expect(result[0].newLevel).toBe(1);
    expect(result[0].progress.xp).toBe(1000);
  });
});

