// src/core/use-cases/survival/IssueSurvivalBattleUseCase.test.ts - Verifica emisión server-side y reanudación.
import { describe, expect, it, vi } from "vitest";
import { ISurvivalRepository } from "@/core/repositories/ISurvivalRepository";
import { ISurvivalBattle, ISurvivalRun } from "@/core/entities/survival/ISurvival";
import { GameState } from "@/core/use-cases/GameEngine";
import { IssueSurvivalBattleUseCase } from "./IssueSurvivalBattleUseCase";

const run = {
  id: "run-1", playerId: "player-1", rulesetVersion: 1, currentBattleIndex: 0,
} as ISurvivalRun;
const battle = { battleId: "battle-1", runId: "run-1" } as ISurvivalBattle;
const configuration = {
  ruleset: {
    id: "r", version: 1, startTier: 4, battlesPerTier: 2,
    roster: ["opponent-1"], milestoneInterval: 5, milestoneHeal: 2000,
  },
  stages: [{
    fromBattle: 1, aiProfile: "HARD" as const, maxTier: 8,
    maxLpBonus: 0, rewardDefinitionId: "base",
  }],
};

describe("IssueSurvivalBattleUseCase", () => {
  it("reanuda el combate pendiente sin crear snapshot nuevo", async () => {
    const snapshotFactory = vi.fn();
    const repository = {
      getActiveRun: vi.fn().mockResolvedValue(run),
      getIssuedBattle: vi.fn().mockResolvedValue(battle),
    } as unknown as ISurvivalRepository;
    const result = await new IssueSurvivalBattleUseCase(repository, snapshotFactory)
      .execute({ playerId: "player-1", runId: "run-1", battleId: "new", seed: "s", expiresAtIso: "2026-08-01T00:00:00Z" });
    expect(result).toEqual({ battle, resumed: true });
    expect(snapshotFactory).not.toHaveBeenCalled();
  });

  it("persiste rival y tier derivados del ruleset", async () => {
    const snapshot = {
      playerA: { id: "player-1" },
      playerB: { id: "opponent-1" },
    } as GameState;
    const repository = {
      getActiveRun: vi.fn().mockResolvedValue(run),
      getIssuedBattle: vi.fn().mockResolvedValue(null),
      getRuleset: vi.fn().mockResolvedValue(configuration),
      issueBattle: vi.fn().mockResolvedValue(battle),
    } as unknown as ISurvivalRepository;
    const useCase = new IssueSurvivalBattleUseCase(
      repository,
      vi.fn().mockResolvedValue({ snapshot, snapshotHash: "hash" }),
    );
    await useCase.execute({ playerId: "player-1", runId: "run-1", battleId: "battle-1", seed: "s", expiresAtIso: "2026-08-01T00:00:00Z" });
    expect(repository.issueBattle).toHaveBeenCalledWith(expect.objectContaining({
      opponentId: "opponent-1", effectiveTier: 4, ascensionRank: 0, snapshotHash: "hash",
    }));
  });
});
