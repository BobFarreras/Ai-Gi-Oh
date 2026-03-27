// src/core/services/opponent/difficulty/resolve-opponent-difficulty-profile.ts - Deriva perfil heurístico final del bot a partir de dificultad base y ai_profile.
import { IStoryAiProfile, normalizeStoryAiProfile } from "@/core/services/opponent/difficulty/story-ai-profile";
import { getDifficultyProfile } from "@/core/services/opponent/difficulty/difficultyProfiles";
import { IOpponentDifficultyProfile, OpponentDifficulty } from "@/core/services/opponent/difficulty/types";

type IStyleTuning = {
  directAttackBias: number;
  lethalBias: number;
  destroyReward: number;
  attackerLossPenalty: number;
  selfDamagePenaltyMultiplier: number;
  executionAggroBias: number;
  entityTempoBias: number;
  minAttackScore: number;
};

const STYLE_TUNING: Record<IStoryAiProfile["style"], IStyleTuning> = {
  balanced: { directAttackBias: 1, lethalBias: 1, destroyReward: 1, attackerLossPenalty: 1, selfDamagePenaltyMultiplier: 1, executionAggroBias: 1, entityTempoBias: 1, minAttackScore: 1 },
  aggressive: { directAttackBias: 1.25, lethalBias: 1.2, destroyReward: 1.05, attackerLossPenalty: 0.82, selfDamagePenaltyMultiplier: 0.8, executionAggroBias: 1.3, entityTempoBias: 1.14, minAttackScore: 0.76 },
  combo: { directAttackBias: 1.08, lethalBias: 1.16, destroyReward: 1.1, attackerLossPenalty: 0.95, selfDamagePenaltyMultiplier: 0.92, executionAggroBias: 1.35, entityTempoBias: 1.18, minAttackScore: 0.9 },
  control: { directAttackBias: 0.84, lethalBias: 0.9, destroyReward: 1.24, attackerLossPenalty: 1.22, selfDamagePenaltyMultiplier: 1.28, executionAggroBias: 0.9, entityTempoBias: 0.98, minAttackScore: 1.25 },
};

function clampMinAttackScore(value: number): number {
  return Math.trunc(Math.max(-3000, Math.min(3000, value)));
}

function toAggressionFactor(aggression: number): number {
  const centered = aggression - 0.5;
  return 1 + centered * 0.6;
}

export function resolveOpponentDifficultyProfile(input: { difficulty: OpponentDifficulty; aiProfile?: unknown }): IOpponentDifficultyProfile {
  const base = getDifficultyProfile(input.difficulty);
  const normalizedAi = normalizeStoryAiProfile(input.aiProfile, "STANDARD");
  const style = STYLE_TUNING[normalizedAi.style];
  const aggressionFactor = toAggressionFactor(normalizedAi.aggression);
  const riskAverseFactor = 1 / aggressionFactor;
  return {
    key: base.key,
    directAttackBias: Math.trunc(base.directAttackBias * style.directAttackBias * aggressionFactor),
    lethalBias: Math.trunc(base.lethalBias * style.lethalBias * aggressionFactor),
    destroyReward: Math.trunc(base.destroyReward * style.destroyReward),
    attackerLossPenalty: Math.trunc(base.attackerLossPenalty * style.attackerLossPenalty * riskAverseFactor),
    selfDamagePenaltyMultiplier: Number((base.selfDamagePenaltyMultiplier * style.selfDamagePenaltyMultiplier * riskAverseFactor).toFixed(3)),
    executionAggroBias: Number((base.executionAggroBias * style.executionAggroBias * aggressionFactor).toFixed(3)),
    entityTempoBias: Number((base.entityTempoBias * style.entityTempoBias).toFixed(3)),
    minAttackScore: clampMinAttackScore(base.minAttackScore * style.minAttackScore * riskAverseFactor),
  };
}
