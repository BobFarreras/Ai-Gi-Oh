// src/core/repositories/ITutorialRewardClaimRepository.ts - Contrato de idempotencia para claim único de recompensa final del tutorial.
export interface ITutorialRewardClaimResult {
  claimedAtIso: string;
  rewardKind: "NEXUS";
  rewardNexus: number;
}

export interface ITutorialRewardClaimRepository {
  getClaimByPlayerId(playerId: string): Promise<ITutorialRewardClaimResult | null>;
  tryClaimNexusReward(playerId: string, rewardNexus: number): Promise<boolean>;
  tryClaimAndApplyNexusReward(playerId: string, rewardNexus: number): Promise<boolean>;
}
