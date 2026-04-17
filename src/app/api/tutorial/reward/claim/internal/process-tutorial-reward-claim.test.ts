// src/app/api/tutorial/reward/claim/internal/process-tutorial-reward-claim.test.ts - Verifica claim final cuando el tutorial está completado.
import { describe, expect, it, vi } from "vitest";
import { processTutorialRewardClaim } from "./process-tutorial-reward-claim";

describe("processTutorialRewardClaim", () => {
  it("aplica recompensa en claim válido", async () => {
    const result = await processTutorialRewardClaim({
      playerId: "p1",
      dependencies: {
        nodeProgressRepository: {
          listCompletedNodeIds: vi.fn().mockResolvedValue(["tutorial-arsenal-basics", "tutorial-combat-basics", "tutorial-market-basics"]),
          markNodeCompleted: vi.fn(),
        },
        rewardClaimRepository: {
          getClaimByPlayerId: vi.fn(),
          tryClaimNexusReward: vi.fn().mockResolvedValue(true),
          tryClaimAndApplyNexusReward: vi.fn().mockResolvedValue(true),
        },
        playerProgressRepository: {
          getByPlayerId: vi.fn().mockResolvedValue({ playerId: "p1", hasCompletedTutorial: false, medals: 0, storyChapter: 1, playerExperience: 0, updatedAtIso: "2026-03-18T10:00:00.000Z" }),
          create: vi.fn(),
          update: vi.fn().mockResolvedValue({ playerId: "p1", hasCompletedTutorial: true, medals: 0, storyChapter: 1, playerExperience: 0, updatedAtIso: "2026-03-18T10:01:00.000Z" }),
        },
      },
    });
    expect(result).toEqual({ applied: true, rewardKind: "NEXUS", rewardNexus: 600 });
  });
});
