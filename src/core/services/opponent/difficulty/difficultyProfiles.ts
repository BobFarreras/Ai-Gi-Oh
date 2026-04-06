// src/core/services/opponent/difficulty/difficultyProfiles.ts - Descripción breve del módulo.
import { IOpponentDifficultyProfile, OpponentDifficulty } from "./types";

const DIFFICULTY_PROFILES: Record<OpponentDifficulty, IOpponentDifficultyProfile> = {
  EASY: {
    key: "EASY",
    directAttackBias: 20,
    lethalBias: 900,
    destroyReward: 750,
    attackerLossPenalty: 320,
    selfDamagePenaltyMultiplier: 0.35,
    executionAggroBias: 0.9,
    entityTempoBias: 0.82,
    minAttackScore: -1800,
  },
  NORMAL: {
    key: "NORMAL",
    directAttackBias: 110,
    lethalBias: 2600,
    destroyReward: 1200,
    attackerLossPenalty: 1300,
    selfDamagePenaltyMultiplier: 1.25,
    executionAggroBias: 1.15,
    entityTempoBias: 1.05,
    minAttackScore: 20,
  },
  HARD: {
    key: "HARD",
    directAttackBias: 240,
    lethalBias: 5200,
    destroyReward: 1850,
    attackerLossPenalty: 2800,
    selfDamagePenaltyMultiplier: 2.25,
    executionAggroBias: 1.5,
    entityTempoBias: 1.3,
    minAttackScore: 140,
  },
  BOSS: {
    key: "BOSS",
    directAttackBias: 420,
    lethalBias: 10400,
    destroyReward: 2450,
    attackerLossPenalty: 3550,
    selfDamagePenaltyMultiplier: 2.85,
    executionAggroBias: 1.95,
    entityTempoBias: 1.46,
    minAttackScore: 250,
  },
  MASTER: {
    key: "MASTER",
    directAttackBias: 520,
    lethalBias: 13600,
    destroyReward: 2780,
    attackerLossPenalty: 4200,
    selfDamagePenaltyMultiplier: 3.2,
    executionAggroBias: 2.18,
    entityTempoBias: 1.62,
    minAttackScore: 320,
  },
  MYTHIC: {
    key: "MYTHIC",
    directAttackBias: 700,
    lethalBias: 18000,
    destroyReward: 3350,
    attackerLossPenalty: 4800,
    selfDamagePenaltyMultiplier: 3.75,
    executionAggroBias: 2.45,
    entityTempoBias: 1.76,
    minAttackScore: 390,
  },
};

export function getDifficultyProfile(difficulty: OpponentDifficulty): IOpponentDifficultyProfile {
  return DIFFICULTY_PROFILES[difficulty];
}

