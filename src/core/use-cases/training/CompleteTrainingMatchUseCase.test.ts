// src/core/use-cases/training/CompleteTrainingMatchUseCase.test.ts - Verifica cierre idempotente de combate training con recompensas y desbloqueos.
import { describe, expect, it, vi } from "vitest";
import { ITrainingMatchClaimRepository } from "@/core/repositories/ITrainingMatchClaimRepository";
import { ITrainingProgressRepository } from "@/core/repositories/ITrainingProgressRepository";
import { IWalletRepository } from "@/core/repositories/IWalletRepository";
import { IPlayerProgressRepository } from "@/core/repositories/IPlayerProgressRepository";
import { ISkillTreeNode } from "@/core/entities/progression/ISkillTreeNode";
import { ISkillTreeRepository } from "@/core/repositories/ISkillTreeRepository";
import { IOlympusChampionUnlockRepository } from "@/core/repositories/IOlympusChampionUnlockRepository";
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
      // 7 victorias previas + esta (WIN) = 8 → desbloquea el tier 2 (requiredWinsInPreviousTier = 8).
      tierStats: [{ tier: 1, wins: 7, matches: 7 }],
      totalWins: 7,
      totalMatches: 7,
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

  it("aplica los modificadores de economía del árbol a la recompensa (+10% Nexus y XP)", async () => {
    const deps = createDependencies();
    vi.mocked(deps.claimRepository.tryReserveMatch).mockResolvedValue(true);
    vi.mocked(deps.trainingProgressRepository.getByPlayerId).mockResolvedValue(createInitialTrainingProgress("p1"));
    vi.mocked(deps.trainingProgressRepository.upsert).mockImplementation(async (progress) => progress);
    vi.mocked(deps.playerProgressRepository.getByPlayerId).mockResolvedValue({
      playerId: "p1", hasCompletedTutorial: false, medals: 0, storyChapter: 1, playerExperience: 100,
      updatedAtIso: "2026-07-18T09:00:00.000Z",
    });
    vi.mocked(deps.playerProgressRepository.update).mockImplementation(async (input) => ({
      playerId: input.playerId, hasCompletedTutorial: false, medals: 0, storyChapter: 1,
      playerExperience: input.playerExperience ?? 0, updatedAtIso: "2026-07-18T10:00:00.000Z",
    }));

    // Comisión Nv.5 (+10% Nexus) + Aprendizaje Nv.5 (+10% XP).
    const skillTreeRepository: ISkillTreeRepository = {
      getActiveCatalog: vi.fn(async (): Promise<ISkillTreeNode[]> => [
        { id: "node-econ-comision", branch: "ECONOMY", tier: 1, maxRank: 5, costPerRank: 1,
          effect: { kind: "NEXUS_REWARD_MULT", valuePerRank: 0.02 }, prerequisites: [], display: { name: "Comisión", blurb: "" } },
        { id: "node-econ-aprendizaje", branch: "ECONOMY", tier: 1, maxRank: 5, costPerRank: 1,
          effect: { kind: "XP_REWARD_MULT", valuePerRank: 0.02 }, prerequisites: [], display: { name: "Aprendizaje", blurb: "" } },
      ]),
      getPlayerRanks: vi.fn(async () => [{ nodeId: "node-econ-comision", rank: 5 }, { nodeId: "node-econ-aprendizaje", rank: 5 }]),
      rankUp: vi.fn(),
      respec: vi.fn(),
    };

    const useCase = new CompleteTrainingMatchUseCase({ ...deps, skillTreeRepository });
    const output = await useCase.execute({ playerId: "p1", battleId: "b-eco", tier: 1, outcome: "WIN", updatedAtIso: "2026-07-18T10:00:00.000Z" });

    // Base WIN tier 1 = { nexus: 30, xp: 80 } → +10% = { 33, 88 }.
    expect(output.reward).toEqual({ nexus: 33, playerExperience: 88 });
    expect(vi.mocked(deps.walletRepository.creditNexus)).toHaveBeenCalledWith("p1", 33);
    expect(vi.mocked(deps.playerProgressRepository.update)).toHaveBeenCalledWith({ playerId: "p1", playerExperience: 188 });
  });

  it("NO-FATAL: si el árbol falla, la recompensa base se aplica igual (el duelo no se rompe)", async () => {
    const deps = createDependencies();
    vi.mocked(deps.claimRepository.tryReserveMatch).mockResolvedValue(true);
    vi.mocked(deps.trainingProgressRepository.getByPlayerId).mockResolvedValue(createInitialTrainingProgress("p1"));
    vi.mocked(deps.trainingProgressRepository.upsert).mockImplementation(async (progress) => progress);
    vi.mocked(deps.playerProgressRepository.getByPlayerId).mockResolvedValue({
      playerId: "p1", hasCompletedTutorial: false, medals: 0, storyChapter: 1, playerExperience: 0,
      updatedAtIso: "2026-07-18T09:00:00.000Z",
    });
    vi.mocked(deps.playerProgressRepository.update).mockImplementation(async (input) => ({
      playerId: input.playerId, hasCompletedTutorial: false, medals: 0, storyChapter: 1,
      playerExperience: input.playerExperience ?? 0, updatedAtIso: "2026-07-18T10:00:00.000Z",
    }));

    const skillTreeRepository: ISkillTreeRepository = {
      getActiveCatalog: vi.fn(async () => { throw new Error("tablas del árbol no migradas"); }),
      getPlayerRanks: vi.fn(async () => []),
      rankUp: vi.fn(),
      respec: vi.fn(),
    };

    const useCase = new CompleteTrainingMatchUseCase({ ...deps, skillTreeRepository });
    const output = await useCase.execute({ playerId: "p1", battleId: "b-fail", tier: 1, outcome: "WIN", updatedAtIso: "2026-07-18T10:00:00.000Z" });

    expect(output.reward).toEqual({ nexus: 30, playerExperience: 80 });
    expect(vi.mocked(deps.walletRepository.creditNexus)).toHaveBeenCalledWith("p1", 30);
  });

  /**
   * Este bloque cubre el hueco que dejó a Olimpo inaccesible: la RPC de desbloqueo existía en base de
   * datos desde la migración 150, pero nadie la llamaba, así que ganar el ladder no prestaba nada.
   */
  function createUnlockScenario() {
    const deps = createDependencies();
    vi.mocked(deps.claimRepository.tryReserveMatch).mockResolvedValue(true);
    vi.mocked(deps.trainingProgressRepository.getByPlayerId).mockResolvedValue(createInitialTrainingProgress("p1"));
    vi.mocked(deps.trainingProgressRepository.upsert).mockImplementation(async (progress) => progress);
    vi.mocked(deps.playerProgressRepository.getByPlayerId).mockResolvedValue({
      playerId: "p1", hasCompletedTutorial: false, medals: 0, storyChapter: 1, playerExperience: 0,
      updatedAtIso: "2026-08-01T09:00:00.000Z",
    });
    vi.mocked(deps.playerProgressRepository.update).mockImplementation(async (input) => ({
      playerId: input.playerId, hasCompletedTutorial: false, medals: 0, storyChapter: 1,
      playerExperience: input.playerExperience ?? 0, updatedAtIso: "2026-08-01T10:00:00.000Z",
    }));
    return deps;
  }

  it("presta como campeón de Olimpo al rival vencido en su tier", async () => {
    const deps = createUnlockScenario();
    const championUnlockRepository: IOlympusChampionUnlockRepository = {
      listChampionIdsEarnedInTier: vi.fn(async () => ["gennvim"]),
      grantUnlock: vi.fn(async () => true),
    };

    const useCase = new CompleteTrainingMatchUseCase({ ...deps, championUnlockRepository });
    const output = await useCase.execute({ playerId: "p1", battleId: "b-1", tier: 1, outcome: "WIN", updatedAtIso: "2026-08-01T10:00:00.000Z" });

    // La victoria de ESTE combate ya cuenta: con una victoria en el tier 1 se ha vencido al primero del ladder.
    expect(championUnlockRepository.listChampionIdsEarnedInTier).toHaveBeenCalledWith(1, 1);
    expect(championUnlockRepository.grantUnlock).toHaveBeenCalledWith("p1", "gennvim", 1, "b-1");
    expect(output.newlyUnlockedChampionIds).toEqual(["gennvim"]);
  });

  it("no presta campeones al perder", async () => {
    const deps = createUnlockScenario();
    const championUnlockRepository: IOlympusChampionUnlockRepository = {
      listChampionIdsEarnedInTier: vi.fn(async () => ["gennvim"]),
      grantUnlock: vi.fn(async () => true),
    };

    const useCase = new CompleteTrainingMatchUseCase({ ...deps, championUnlockRepository });
    const output = await useCase.execute({ playerId: "p1", battleId: "b-2", tier: 1, outcome: "LOSE", updatedAtIso: "2026-08-01T10:00:00.000Z" });

    expect(championUnlockRepository.grantUnlock).not.toHaveBeenCalled();
    expect(output.newlyUnlockedChampionIds).toEqual([]);
  });

  it("NO-FATAL: si Olimpo falla, el cierre del combate se completa igual", async () => {
    const deps = createUnlockScenario();
    const championUnlockRepository: IOlympusChampionUnlockRepository = {
      listChampionIdsEarnedInTier: vi.fn(async () => { throw new Error("Olimpo sin migrar"); }),
      grantUnlock: vi.fn(),
    };

    const useCase = new CompleteTrainingMatchUseCase({ ...deps, championUnlockRepository });
    const output = await useCase.execute({ playerId: "p1", battleId: "b-3", tier: 1, outcome: "WIN", updatedAtIso: "2026-08-01T10:00:00.000Z" });

    expect(output.applied).toBe(true);
    expect(output.newlyUnlockedChampionIds).toEqual([]);
  });
});
