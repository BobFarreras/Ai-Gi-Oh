// src/core/entities/survival/ISurvival.ts - Contratos del agregado autoritativo de Supervivencia.
export type SurvivalRunStatus = "ACTIVE" | "COMPLETED_DEFEAT" | "ABANDONED";
export type SurvivalBattleStatus = "ISSUED" | "COMPLETED" | "EXPIRED";
export type SurvivalOutcome = "WIN" | "LOSS" | "DRAW";
export type SurvivalAiProfile = "HARD" | "BOSS" | "MASTER" | "MYTHIC";

export interface ISurvivalRuleset {
  id: string;
  version: number;
  startTier: number;
  battlesPerTier: number;
  roster: string[];
  milestoneInterval: number;
  milestoneHeal: number;
}

export interface ISurvivalScalingStage {
  fromBattle: number;
  aiProfile: SurvivalAiProfile;
  maxTier: number;
  maxLpBonus: number;
  rewardDefinitionId: string;
}

export interface ISurvivalRun {
  id: string;
  playerId: string;
  status: SurvivalRunStatus;
  currentLp: number;
  maxLp: number;
  wins: number;
  currentBattleIndex: number;
  rulesetVersion: number;
  startedAtIso: string;
  completedAtIso: string | null;
  version: number;
}

export interface ISurvivalBattle {
  battleId: string;
  runId: string;
  battleIndex: number;
  opponentId: string;
  effectiveTier: number;
  ascensionRank: number;
  startingLp: number;
  endingLp: number | null;
  status: SurvivalBattleStatus;
  outcome: SurvivalOutcome | null;
  milestoneHeal: number;
  reward: Record<string, unknown> | null;
}

export interface ISurvivalEncounter {
  battleIndex: number;
  opponentId: string;
  effectiveTier: number;
  ascensionRank: number;
  aiProfile: SurvivalAiProfile;
  maxLpBonus: number;
  rewardDefinitionId: string;
}
