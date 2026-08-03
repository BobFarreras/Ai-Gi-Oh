// src/core/services/match/rewards/match-reward-policy.ts - Calcula recompensas de duelo por modo sin depender de UI ni persistencia.
import { ValidationError } from "@/core/errors/ValidationError";
import { IMatchMode } from "@/core/entities/match/IMatchMode";
import { IMatchOutcome } from "@/core/entities/match/IMatchOutcome";
import { IMatchReward } from "@/core/entities/match/IMatchReward";

export interface IMatchRewardContext {
  mode: IMatchMode;
  outcome: IMatchOutcome;
  storyOpponentTier?: number;
}

function resolveStoryMultiplier(tier?: number): number {
  const safeTier = Math.floor(tier ?? 1);
  if (safeTier < 1 || safeTier > 10) throw new ValidationError("El tier de oponente de historia debe estar entre 1 y 10.");
  return safeTier;
}

function rewardForTutorial(): IMatchReward {
  return { nexus: 0, playerExperience: 0 };
}

function rewardForTraining(outcome: IMatchOutcome): IMatchReward {
  if (outcome === "WIN") return { nexus: 30, playerExperience: 80 };
  if (outcome === "LOSE") return { nexus: 8, playerExperience: 20 };
  return { nexus: 16, playerExperience: 45 };
}

function rewardForStory(outcome: IMatchOutcome, tier?: number): IMatchReward {
  const multiplier = resolveStoryMultiplier(tier);
  if (outcome === "WIN") return { nexus: 50 * multiplier, playerExperience: 110 * multiplier };
  if (outcome === "LOSE") return { nexus: 12 * multiplier, playerExperience: 25 * multiplier };
  return { nexus: 28 * multiplier, playerExperience: 60 * multiplier };
}

function rewardForMultiplayer(outcome: IMatchOutcome): IMatchReward {
  if (outcome === "WIN") return { nexus: 90, playerExperience: 140 };
  if (outcome === "LOSE") return { nexus: 18, playerExperience: 40 };
  return { nexus: 45, playerExperience: 80 };
}

export function resolveMatchReward(context: IMatchRewardContext): IMatchReward {
  if (context.mode === "TUTORIAL") return rewardForTutorial();
  // Estos modos liquidan una economía versionada propia; el fallback común nunca concede premios.
  if (context.mode === "SURVIVAL" || context.mode === "OLYMPUS") return rewardForTutorial();
  if (context.mode === "TRAINING") return rewardForTraining(context.outcome);
  if (context.mode === "STORY") return rewardForStory(context.outcome, context.storyOpponentTier);
  return rewardForMultiplayer(context.outcome);
}
