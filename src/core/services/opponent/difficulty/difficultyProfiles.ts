// src/core/services/opponent/difficulty/difficultyProfiles.ts - Descripción breve del módulo.
import { IOpponentDifficultyProfile, OpponentDifficulty } from "./types";

const DIFFICULTY_PROFILES: Record<OpponentDifficulty, IOpponentDifficultyProfile> = {
  EASY: {
    key: "EASY",
    directAttackBias: 40,
    lethalBias: 1500,
    destroyReward: 900,
    attackerLossPenalty: 450,
    selfDamagePenaltyMultiplier: 0.45,
    executionAggroBias: 1.0,
    entityTempoBias: 0.9,
    minAttackScore: -1600,
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
    attackerLossPenalty: 2600,
    selfDamagePenaltyMultiplier: 2.1,
    executionAggroBias: 1.4,
    entityTempoBias: 1.25,
    minAttackScore: 100,
  },
  BOSS: {
    key: "BOSS",
    directAttackBias: 350,
    lethalBias: 9000,
    destroyReward: 2200,
    attackerLossPenalty: 3300,
    selfDamagePenaltyMultiplier: 2.6,
    executionAggroBias: 1.8,
    entityTempoBias: 1.4,
    minAttackScore: 180,
  },
  MASTER: {
    key: "MASTER",
    directAttackBias: 460,
    lethalBias: 12000,
    destroyReward: 2600,
    attackerLossPenalty: 3900,
    selfDamagePenaltyMultiplier: 3.1,
    executionAggroBias: 2.05,
    entityTempoBias: 1.55,
    minAttackScore: 260,
  },
  MYTHIC: {
    key: "MYTHIC",
    directAttackBias: 620,
    lethalBias: 16000,
    destroyReward: 3100,
    attackerLossPenalty: 4600,
    selfDamagePenaltyMultiplier: 3.6,
    executionAggroBias: 2.3,
    entityTempoBias: 1.7,
    minAttackScore: 340,
  },
};

export function getDifficultyProfile(difficulty: OpponentDifficulty): IOpponentDifficultyProfile {
  return DIFFICULTY_PROFILES[difficulty];
}

