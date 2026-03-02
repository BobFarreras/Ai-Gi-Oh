export type OpponentDifficulty = "EASY" | "NORMAL" | "HARD" | "BOSS";

export interface ICampaignProgress {
  chapterIndex: number;
  duelIndex: number;
  victories: number;
}

export interface IOpponentDifficultyProfile {
  key: OpponentDifficulty;
  directAttackBias: number;
  lethalBias: number;
  destroyReward: number;
  attackerLossPenalty: number;
  selfDamagePenaltyMultiplier: number;
  executionAggroBias: number;
  entityTempoBias: number;
  minAttackScore: number;
}

