// src/core/use-cases/tutorial/ClaimTutorialFinalRewardUseCase.ts - Reclama recompensa final idempotente tras completar nodos previos del tutorial.
import { ValidationError } from "@/core/errors/ValidationError";
import { IPlayerProgressRepository } from "@/core/repositories/IPlayerProgressRepository";
import { ITutorialNodeProgressRepository } from "@/core/repositories/ITutorialNodeProgressRepository";
import { ITutorialRewardClaimRepository } from "@/core/repositories/ITutorialRewardClaimRepository";
import { resolveTutorialFinalReward } from "@/core/services/tutorial/resolve-tutorial-final-reward";
import { GetOrCreatePlayerProgressUseCase } from "@/core/use-cases/player/GetOrCreatePlayerProgressUseCase";

interface IClaimTutorialFinalRewardInput {
  playerId: string;
}

interface IClaimTutorialFinalRewardDependencies {
  nodeProgressRepository: ITutorialNodeProgressRepository;
  rewardClaimRepository: ITutorialRewardClaimRepository;
  playerProgressRepository: IPlayerProgressRepository;
}

interface IClaimTutorialFinalRewardOutput {
  applied: boolean;
  rewardKind: "NEXUS";
  rewardNexus: number;
}

function resolveRequiredNodeIds(): string[] {
  return ["tutorial-combat-basics"];
}

export class ClaimTutorialFinalRewardUseCase {
  constructor(private readonly dependencies: IClaimTutorialFinalRewardDependencies) {}

  /**
   * Aplica una sola vez la recompensa final cuando el jugador completó todos los nodos funcionales.
   */
  async execute(input: IClaimTutorialFinalRewardInput): Promise<IClaimTutorialFinalRewardOutput> {
    if (!input.playerId.trim()) throw new ValidationError("El jugador es obligatorio para reclamar recompensa tutorial.");
    const reward = resolveTutorialFinalReward();
    const completedNodeIds = new Set(await this.dependencies.nodeProgressRepository.listCompletedNodeIds(input.playerId));
    const hasAllRequiredNodes = resolveRequiredNodeIds().every((nodeId) => completedNodeIds.has(nodeId));
    if (!hasAllRequiredNodes) throw new ValidationError("Debes completar todos los nodos del tutorial antes de reclamar la recompensa final.");

    const claimed = await this.dependencies.rewardClaimRepository.tryClaimAndApplyNexusReward(input.playerId, reward.nexus);
    if (!claimed) return { applied: false, rewardKind: "NEXUS", rewardNexus: reward.nexus };

    await this.dependencies.nodeProgressRepository.markNodeCompleted(input.playerId, "tutorial-final-reward");

    const progressUseCase = new GetOrCreatePlayerProgressUseCase(this.dependencies.playerProgressRepository);
    await progressUseCase.execute({ playerId: input.playerId });
    await this.dependencies.playerProgressRepository.update({ playerId: input.playerId, hasCompletedTutorial: true });
    return { applied: true, rewardKind: "NEXUS", rewardNexus: reward.nexus };
  }
}
