// src/app/api/tutorial/combat/reward/claim/internal/process-tutorial-combat-reward-claim.ts - Orquesta el claim de carta del tutorial de combate para jugador autenticado.
import { ICardCollectionRepository } from "@/core/repositories/ICardCollectionRepository";
import { ITutorialNodeProgressRepository } from "@/core/repositories/ITutorialNodeProgressRepository";
import { ClaimTutorialCombatRewardUseCase } from "@/core/use-cases/tutorial/ClaimTutorialCombatRewardUseCase";

interface IProcessTutorialCombatRewardClaimInput {
  playerId: string;
  dependencies: {
    nodeProgressRepository: ITutorialNodeProgressRepository;
    collectionRepository: ICardCollectionRepository;
  };
}

/**
 * Ejecuta claim idempotente de carta de recompensa del tutorial de combate.
 */
export async function processTutorialCombatRewardClaim(input: IProcessTutorialCombatRewardClaimInput) {
  const useCase = new ClaimTutorialCombatRewardUseCase(input.dependencies);
  return useCase.execute({ playerId: input.playerId });
}
