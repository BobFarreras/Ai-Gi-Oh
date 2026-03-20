// src/core/use-cases/training/CompleteTrainingMatchUseCase.ts - Orquesta cierre de combate training con idempotencia, progreso y recompensas.
import { ValidationError } from "@/core/errors/ValidationError";
import { IMatchOutcome } from "@/core/entities/match/IMatchOutcome";
import { IMatchReward } from "@/core/entities/match/IMatchReward";
import { ITrainingMatchClaimRepository } from "@/core/repositories/ITrainingMatchClaimRepository";
import { ITrainingProgressRepository } from "@/core/repositories/ITrainingProgressRepository";
import { IWalletRepository } from "@/core/repositories/IWalletRepository";
import { IPlayerProgressRepository } from "@/core/repositories/IPlayerProgressRepository";
import { applyTrainingMatchResult } from "@/core/services/training/apply-training-match-result";
import { createInitialTrainingProgress, resolveTrainingTierCatalog } from "@/core/services/training/resolve-training-tier-catalog";
import { resolveTrainingTierReward } from "@/core/services/training/resolve-training-tier-reward";
import { GetOrCreatePlayerProgressUseCase } from "@/core/use-cases/player/GetOrCreatePlayerProgressUseCase";

interface ICompleteTrainingMatchInput {
  playerId: string;
  battleId: string;
  tier: number;
  outcome: IMatchOutcome;
  updatedAtIso: string;
}

interface ICompleteTrainingMatchOutput {
  applied: boolean;
  reward: IMatchReward;
  highestUnlockedTier: number;
  newlyUnlockedTiers: number[];
}

interface ICompleteTrainingMatchDependencies {
  claimRepository: ITrainingMatchClaimRepository;
  trainingProgressRepository: ITrainingProgressRepository;
  walletRepository: IWalletRepository;
  playerProgressRepository: IPlayerProgressRepository;
}

export class CompleteTrainingMatchUseCase {
  constructor(private readonly dependencies: ICompleteTrainingMatchDependencies) {}

  /**
   * Registra el resultado de un combate de entrenamiento una sola vez y aplica recompensas escaladas por tier.
   */
  async execute(input: ICompleteTrainingMatchInput): Promise<ICompleteTrainingMatchOutput> {
    if (!input.playerId.trim() || !input.battleId.trim() || !input.updatedAtIso.trim()) {
      throw new ValidationError("Los datos de cierre de entrenamiento son obligatorios.");
    }
    const reserved = await this.dependencies.claimRepository.tryReserveMatch(input.playerId, input.battleId, input.tier);
    if (!reserved) return { applied: false, reward: { nexus: 0, playerExperience: 0 }, highestUnlockedTier: 1, newlyUnlockedTiers: [] };

    const catalog = resolveTrainingTierCatalog();
    const tierConfig = catalog.find((item) => item.tier === input.tier);
    if (!tierConfig) throw new ValidationError("El tier seleccionado no existe en el catálogo de entrenamiento.");
    const currentProgress = (await this.dependencies.trainingProgressRepository.getByPlayerId(input.playerId)) ?? createInitialTrainingProgress(input.playerId);
    const trainingResolution = applyTrainingMatchResult({
      catalog,
      progress: currentProgress,
      tier: input.tier,
      outcome: input.outcome,
      updatedAtIso: input.updatedAtIso,
    });
    await this.dependencies.trainingProgressRepository.upsert(trainingResolution.nextProgress);

    const reward = resolveTrainingTierReward(input.outcome, tierConfig.rewardMultiplier);
    if (reward.nexus > 0) await this.dependencies.walletRepository.creditNexus(input.playerId, reward.nexus);

    const progressUseCase = new GetOrCreatePlayerProgressUseCase(this.dependencies.playerProgressRepository);
    const playerProgress = await progressUseCase.execute({ playerId: input.playerId });
    await this.dependencies.playerProgressRepository.update({
      playerId: input.playerId,
      playerExperience: playerProgress.playerExperience + reward.playerExperience,
    });

    return {
      applied: true,
      reward,
      highestUnlockedTier: trainingResolution.nextProgress.highestUnlockedTier,
      newlyUnlockedTiers: trainingResolution.newlyUnlockedTiers,
    };
  }
}
