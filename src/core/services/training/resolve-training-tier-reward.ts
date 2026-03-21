// src/core/services/training/resolve-training-tier-reward.ts - Calcula recompensas escaladas de Training por tier y resultado.
import { IMatchOutcome } from "@/core/entities/match/IMatchOutcome";
import { IMatchReward } from "@/core/entities/match/IMatchReward";
import { resolveMatchReward } from "@/core/services/match/rewards/match-reward-policy";

function scaleReward(base: IMatchReward, multiplier: number): IMatchReward {
  return {
    nexus: Math.floor(base.nexus * multiplier),
    playerExperience: Math.floor(base.playerExperience * multiplier),
  };
}

/**
 * Devuelve la recompensa final de training para mantener consistencia entre backend y UI.
 */
export function resolveTrainingTierReward(outcome: IMatchOutcome, rewardMultiplier: number): IMatchReward {
  if (outcome === "LOSE") {
    const winReward = scaleReward(resolveMatchReward({ mode: "TRAINING", outcome: "WIN" }), rewardMultiplier);
    return {
      nexus: Math.floor(winReward.nexus / 2),
      playerExperience: Math.floor(winReward.playerExperience / 2),
    };
  }
  return scaleReward(resolveMatchReward({ mode: "TRAINING", outcome }), rewardMultiplier);
}
