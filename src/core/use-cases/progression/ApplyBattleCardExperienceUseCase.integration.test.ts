// src/core/use-cases/progression/ApplyBattleCardExperienceUseCase.integration.test.ts - Integra EXP post-duelo con progresión persistida y bonus aplicados en siguiente combate.
import { describe, expect, it } from "vitest";
import { ICard } from "@/core/entities/ICard";
import { IPlayerCardProgress } from "@/core/entities/progression/IPlayerCardProgress";
import { IPlayerCardProgressRepository } from "@/core/repositories/IPlayerCardProgressRepository";
import { ApplyBattleCardExperienceUseCase } from "./ApplyBattleCardExperienceUseCase";
import { applyCardProgressionToCard } from "@/services/game/apply-card-progression-to-card";

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

const ENTITY_CARD: ICard = {
  id: "entity-python",
  name: "Python",
  description: "Lenguaje flexible.",
  type: "ENTITY",
  faction: "OPEN_SOURCE",
  cost: 3,
  attack: 1200,
  defense: 1100,
};

const TRAP_CARD: ICard = {
  id: "trap-firewall",
  name: "Firewall Trap",
  description: "Bloquea un ataque.",
  type: "TRAP",
  faction: "OPEN_SOURCE",
  cost: 2,
  trigger: "ON_OPPONENT_ATTACK_DECLARED",
  effect: { action: "NEGATE_ATTACK_AND_DESTROY_ATTACKER" },
};

describe("ApplyBattleCardExperienceUseCase integration", () => {
  it("aplica EXP de duelo y en el siguiente combate refleja bonus de atributos en ENTITY", async () => {
    const repository = new InMemoryPlayerCardProgressRepository();
    await repository.upsert({ playerId: "p1", cardId: "entity-python", level: 4, xp: 390, versionTier: 0 });
    const useCase = new ApplyBattleCardExperienceUseCase(repository);

    const results = await useCase.execute({
      playerId: "p1",
      events: [{ cardId: "entity-python", eventType: "SUMMON_SUCCESS" }],
    });

    expect(results[0].oldLevel).toBe(4);
    expect(results[0].newLevel).toBe(5);
    const cardForNextCombat = applyCardProgressionToCard(ENTITY_CARD, results[0].progress);
    expect(cardForNextCombat.attack).toBe(1300);
    expect(cardForNextCombat.defense).toBe(1100);
  });

  it("en TRAP al nivel 30 no sube ATK/DEF y solo reduce coste", async () => {
    const repository = new InMemoryPlayerCardProgressRepository();
    await repository.upsert({ playerId: "p2", cardId: "trap-firewall", level: 30, xp: 400000, versionTier: 0 });
    const progress = await repository.getByPlayerAndCard("p2", "trap-firewall");
    const cardForNextCombat = applyCardProgressionToCard(TRAP_CARD, progress);
    expect(cardForNextCombat.cost).toBe(1);
    expect(cardForNextCombat.attack).toBeUndefined();
    expect(cardForNextCombat.defense).toBeUndefined();
  });
});
