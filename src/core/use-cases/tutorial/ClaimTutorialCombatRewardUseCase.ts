// src/core/use-cases/tutorial/ClaimTutorialCombatRewardUseCase.ts - Reclama recompensa de carta del tutorial de combate de forma idempotente.
import { ValidationError } from "@/core/errors/ValidationError";
import { ICardCollectionRepository } from "@/core/repositories/ICardCollectionRepository";
import { ITutorialNodeProgressRepository } from "@/core/repositories/ITutorialNodeProgressRepository";

interface IClaimTutorialCombatRewardInput {
  playerId: string;
}

interface IClaimTutorialCombatRewardDependencies {
  nodeProgressRepository: ITutorialNodeProgressRepository;
  collectionRepository: ICardCollectionRepository;
}

interface IClaimTutorialCombatRewardOutput {
  applied: boolean;
  rewardCardId: string;
}

const COMBAT_NODE_ID = "tutorial-combat-basics";
const CLAIM_NODE_ID = "tutorial-combat-reward-gemgpt";
const REWARD_CARD_ID = "exec-fusion-gemgpt";

/**
 * Otorga una carta de fusión tutorial solo una vez cuando el nodo de combate ya está completado.
 */
export class ClaimTutorialCombatRewardUseCase {
  constructor(private readonly dependencies: IClaimTutorialCombatRewardDependencies) {}

  async execute(input: IClaimTutorialCombatRewardInput): Promise<IClaimTutorialCombatRewardOutput> {
    if (!input.playerId.trim()) throw new ValidationError("El jugador es obligatorio para reclamar la recompensa de combate.");
    const completedNodeIds = new Set(await this.dependencies.nodeProgressRepository.listCompletedNodeIds(input.playerId));
    if (!completedNodeIds.has(COMBAT_NODE_ID)) {
      throw new ValidationError("Debes completar el tutorial de combate antes de reclamar esta recompensa.");
    }
    if (completedNodeIds.has(CLAIM_NODE_ID)) return { applied: false, rewardCardId: REWARD_CARD_ID };
    await this.dependencies.collectionRepository.addCards(input.playerId, [REWARD_CARD_ID]);
    await this.dependencies.nodeProgressRepository.markNodeCompleted(input.playerId, CLAIM_NODE_ID);
    return { applied: true, rewardCardId: REWARD_CARD_ID };
  }
}
