// src/core/use-cases/survival/CompleteSurvivalBattleUseCase.test.ts - Verifica liquidación derivada del replay.
import { describe, expect, it, vi } from "vitest";
import { COMBAT_PROOF_PROTOCOL_VERSION, ICombatProof } from "@/core/entities/match";
import { ISurvivalBattle, ISurvivalRun } from "@/core/entities/survival/ISurvival";
import { ISurvivalRepository } from "@/core/repositories/ISurvivalRepository";
import { createInitialGameState } from "@/core/use-cases/game-engine/state/create-initial-game-state";
import { CompleteSurvivalBattleUseCase } from "./CompleteSurvivalBattleUseCase";

const nowIso = "2026-07-30T10:30:00.000Z";
const battle = {
  battleId: "battle-1", runId: "run-1", battleIndex: 5, status: "ISSUED",
  effectiveTier: 6, ascensionRank: 0,
} as ISurvivalBattle;
const run = { id: "run-1", playerId: "player-1", currentLp: 8000 } as ISurvivalRun;

function createRepository(): ISurvivalRepository {
  const snapshot = createInitialGameState({
    playerA: { id: "player-1", name: "P", deck: [] },
    playerB: { id: "opponent-1", name: "O", deck: [] },
    starterPlayerId: "player-1",
  });
  snapshot.playerB = { ...snapshot.playerB, healthPoints: 0 };
  return {
    getCombatSession: vi.fn().mockResolvedValue({
      session: {
        id: "session-1", battleId: "battle-1", mode: "SURVIVAL",
        playerId: "player-1", opponentId: "opponent-1", seed: "seed",
        snapshotHash: "hash", protocolVersion: COMBAT_PROOF_PROTOCOL_VERSION,
        issuedAtIso: "2026-07-30T10:00:00.000Z", expiresAtIso: "2026-07-30T11:00:00.000Z",
      },
      snapshot,
    }),
    getBattleById: vi.fn()
      .mockResolvedValueOnce(battle)
      .mockResolvedValueOnce({
        ...battle, status: "COMPLETED", outcome: "WIN", endingLp: 8000,
        milestoneHeal: 2000, reward: { ascensionFragments: 31 },
      }),
    getRunById: vi.fn().mockResolvedValue(run),
    getProgress: vi.fn().mockResolvedValue({ bestWins: 5, ascensionFragments: 131 }),
    getRuleset: vi.fn().mockResolvedValue({
      ruleset: {
        id: "r", version: 1, startTier: 4, battlesPerTier: 2,
        roster: ["opponent-1"], milestoneInterval: 5, milestoneHeal: 2000,
      },
      stages: [{
        fromBattle: 1, aiProfile: "HARD", maxTier: 8,
        maxLpBonus: 0, statBonusPerRank: 0, rewardDefinitionId: "base",
      }],
    }),
    completeBattle: vi.fn().mockResolvedValue(run),
  } as unknown as ISurvivalRepository;
}

describe("CompleteSurvivalBattleUseCase", () => {
  it("deriva victoria, LP y Fragmentos desde el estado reproducido", async () => {
    const repository = createRepository();
    const proof: ICombatProof = {
      sessionId: "session-1", battleId: "battle-1", mode: "SURVIVAL",
      snapshotHash: "hash", protocolVersion: COMBAT_PROOF_PROTOCOL_VERSION, entries: [],
    };
    const result = await new CompleteSurvivalBattleUseCase(repository).execute("player-1", proof, nowIso);
    expect(result).toMatchObject({ outcome: "WIN", duplicate: false });
    expect(result.progress).toEqual({ bestWins: 5, ascensionFragments: 131 });
    expect(repository.completeBattle).toHaveBeenCalledWith(expect.objectContaining({
      outcome: "WIN", endingLp: 8000, fragmentAmount: 31,
    }));
  });

  it("devuelve la liquidación persistida sin duplicar créditos en un retry", async () => {
    const repository = createRepository();
    vi.mocked(repository.getBattleById).mockReset().mockResolvedValue({
      ...battle,
      status: "COMPLETED",
      outcome: "WIN",
      endingLp: 6000,
      milestoneHeal: 2000,
      reward: {
        ascensionFragments: 31,
        definitionId: "base",
        milestoneReached: true,
      },
    });
    const proof: ICombatProof = {
      sessionId: "session-1", battleId: "battle-1", mode: "SURVIVAL",
      snapshotHash: "hash", protocolVersion: COMBAT_PROOF_PROTOCOL_VERSION, entries: [],
    };

    const result = await new CompleteSurvivalBattleUseCase(repository)
      .execute("player-1", proof, nowIso);

    expect(result).toMatchObject({ duplicate: true, outcome: "WIN" });
    expect(repository.completeBattle).not.toHaveBeenCalled();
  });
});
