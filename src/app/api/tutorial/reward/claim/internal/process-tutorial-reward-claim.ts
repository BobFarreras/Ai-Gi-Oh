// src/app/api/tutorial/reward/claim/internal/process-tutorial-reward-claim.ts - Orquesta claim final tutorial con idempotencia y recompensa.
import { IPlayerProgressRepository } from "@/core/repositories/IPlayerProgressRepository";
import { ITutorialNodeProgressRepository } from "@/core/repositories/ITutorialNodeProgressRepository";
import { ITutorialRewardClaimRepository } from "@/core/repositories/ITutorialRewardClaimRepository";
import { IWalletRepository } from "@/core/repositories/IWalletRepository";
import { ClaimTutorialFinalRewardUseCase } from "@/core/use-cases/tutorial/ClaimTutorialFinalRewardUseCase";

interface IProcessTutorialRewardClaimInput {
  playerId: string;
  dependencies: {
    nodeProgressRepository: ITutorialNodeProgressRepository;
    rewardClaimRepository: ITutorialRewardClaimRepository;
    walletRepository: IWalletRepository;
    playerProgressRepository: IPlayerProgressRepository;
  };
}

/**
 * Reclama recompensa final cuando el progreso de nodos ya cumple los requisitos.
 */
export async function processTutorialRewardClaim(input: IProcessTutorialRewardClaimInput) {
  const useCase = new ClaimTutorialFinalRewardUseCase(input.dependencies);
  return useCase.execute({ playerId: input.playerId });
}
