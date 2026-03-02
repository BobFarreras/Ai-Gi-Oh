import { IOpponentDifficultyProfile, OpponentDifficulty } from "./types";

const DIFFICULTY_PROFILES: Record<OpponentDifficulty, IOpponentDifficultyProfile> = {
  EASY: {
    key: "EASY",
    directAttackBias: 40,
    lethalBias: 1500,
    destroyReward: 900,
    attackerLossPenalty: 700,
    selfDamagePenaltyMultiplier: 0.8,
    executionAggroBias: 1.0,
    entityTempoBias: 0.9,
    minAttackScore: -2000,
  },
  NORMAL: {
    key: "NORMAL",
    directAttackBias: 120,
    lethalBias: 2800,
    destroyReward: 1300,
    attackerLossPenalty: 1200,
    selfDamagePenaltyMultiplier: 1.2,
    executionAggroBias: 1.2,
    entityTempoBias: 1.1,
    minAttackScore: -20,
  },
  HARD: {
    key: "HARD",
    directAttackBias: 220,
    lethalBias: 4500,
    destroyReward: 1700,
    attackerLossPenalty: 1700,
    selfDamagePenaltyMultiplier: 1.6,
    executionAggroBias: 1.4,
    entityTempoBias: 1.25,
    minAttackScore: 60,
  },
  BOSS: {
    key: "BOSS",
    directAttackBias: 350,
    lethalBias: 9000,
    destroyReward: 2200,
    attackerLossPenalty: 2300,
    selfDamagePenaltyMultiplier: 2,
    executionAggroBias: 1.8,
    entityTempoBias: 1.4,
    minAttackScore: 130,
  },
};

export function getDifficultyProfile(difficulty: OpponentDifficulty): IOpponentDifficultyProfile {
  return DIFFICULTY_PROFILES[difficulty];
}
