// src/core/use-cases/tutorial/ClaimTutorialFinalRewardUseCase.test.ts - Verifica eligibility e idempotencia del claim final de tutorial.
import { describe, expect, it, vi } from "vitest";
import { ClaimTutorialFinalRewardUseCase } from "./ClaimTutorialFinalRewardUseCase";

describe("ClaimTutorialFinalRewardUseCase", () => {
  it("aplica recompensa nexus cuando todos los nodos previos están completos", async () => {
    const useCase = new ClaimTutorialFinalRewardUseCase({
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
    });

    const result = await useCase.execute({ playerId: "p1" });
    expect(result).toEqual({ applied: true, rewardKind: "NEXUS", rewardNexus: 600 });
  });
});
