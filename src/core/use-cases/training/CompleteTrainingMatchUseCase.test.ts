// src/core/use-cases/training/CompleteTrainingMatchUseCase.test.ts - Verifica cierre idempotente de combate training con recompensas y desbloqueos.
import { describe, expect, it, vi } from "vitest";
import { ITrainingMatchClaimRepository } from "@/core/repositories/ITrainingMatchClaimRepository";
import { ITrainingProgressRepository } from "@/core/repositories/ITrainingProgressRepository";
import { IWalletRepository } from "@/core/repositories/IWalletRepository";
import { IPlayerProgressRepository } from "@/core/repositories/IPlayerProgressRepository";
import { createInitialTrainingProgress } from "@/core/services/training/resolve-training-tier-catalog";
import { CompleteTrainingMatchUseCase } from "./CompleteTrainingMatchUseCase";

function createDependencies() {
  const claimRepository: ITrainingMatchClaimRepository = { tryReserveMatch: vi.fn() };
  const trainingProgressRepository: ITrainingProgressRepository = { getByPlayerId: vi.fn(), upsert: vi.fn() };
  const walletRepository: IWalletRepository = { getWallet: vi.fn(), creditNexus: vi.fn(), debitNexus: vi.fn() };
  const playerProgressRepository: IPlayerProgressRepository = { getByPlayerId: vi.fn(), create: vi.fn(), update: vi.fn() };
  return { claimRepository, trainingProgressRepository, walletRepository, playerProgressRepository };
}

describe("CompleteTrainingMatchUseCase", () => {
  it("aplica progreso y recompensas cuando la reserva es nueva", async () => {
    const deps = createDependencies();
    vi.mocked(deps.claimRepository.tryReserveMatch).mockResolvedValue(true);
    vi.mocked(deps.trainingProgressRepository.getByPlayerId).mockResolvedValue({
      ...createInitialTrainingProgress("p1"),
      tierStats: [{ tier: 1, wins: 4, matches: 4 }],
      totalWins: 4,
      totalMatches: 4,
      updatedAtIso: "2026-03-17T09:00:00.000Z",
    });
    vi.mocked(deps.trainingProgressRepository.upsert).mockImplementation(async (progress) => progress);
    vi.mocked(deps.playerProgressRepository.getByPlayerId).mockResolvedValue({
      playerId: "p1",
      hasCompletedTutorial: false,
      medals: 0,
      storyChapter: 1,
      playerExperience: 100,
      updatedAtIso: "2026-03-17T09:00:00.000Z",
    });
    vi.mocked(deps.playerProgressRepository.update).mockImplementation(async (input) => ({
      playerId: input.playerId,
      hasCompletedTutorial: false,
      medals: 0,
      storyChapter: 1,
      playerExperience: input.playerExperience ?? 0,
      updatedAtIso: "2026-03-17T10:00:00.000Z",
    }));

    const useCase = new CompleteTrainingMatchUseCase(deps);
    const output = await useCase.execute({
      playerId: "p1",
      battleId: "b-1",
      tier: 1,
      outcome: "WIN",
      updatedAtIso: "2026-03-17T10:00:00.000Z",
    });

    expect(output.applied).toBe(true);
    expect(output.reward.nexus).toBe(30);
    expect(output.reward.playerExperience).toBe(80);
    expect(output.newlyUnlockedTiers).toEqual([2]);
    expect(vi.mocked(deps.walletRepository.creditNexus)).toHaveBeenCalledWith("p1", 30);
    expect(vi.mocked(deps.playerProgressRepository.update)).toHaveBeenCalledWith({ playerId: "p1", playerExperience: 180 });
  });

  it("no aplica recompensas cuando la batalla ya fue procesada", async () => {
    const deps = createDependencies();
    vi.mocked(deps.claimRepository.tryReserveMatch).mockResolvedValue(false);
    const useCase = new CompleteTrainingMatchUseCase(deps);

    const output = await useCase.execute({
      playerId: "p1",
      battleId: "b-dup",
      tier: 1,
      outcome: "WIN",
      updatedAtIso: "2026-03-17T10:00:00.000Z",
    });

    expect(output.applied).toBe(false);
    expect(output.reward).toEqual({ nexus: 0, playerExperience: 0 });
    expect(vi.mocked(deps.walletRepository.creditNexus)).not.toHaveBeenCalled();
    expect(vi.mocked(deps.trainingProgressRepository.upsert)).not.toHaveBeenCalled();
  });
});
