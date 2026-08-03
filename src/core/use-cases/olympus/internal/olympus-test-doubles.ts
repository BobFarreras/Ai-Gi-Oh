// src/core/use-cases/olympus/internal/olympus-test-doubles.ts - Catálogo y entidades mínimas compartidas por los tests de Olimpo.
import {
  IOlympusBattle,
  IOlympusChampion,
  IOlympusChampionProgress,
  IOlympusLegend,
  IOlympusSettings,
  IOlympusUpgradeNode,
} from "@/core/entities/olympus/IOlympus";
import { IOlympusCatalog } from "@/core/repositories/IOlympusRepository";

export const olympusSettings: IOlympusSettings = {
  version: 1,
  dailyAttemptLimit: 3,
  battleTtlMinutes: 45,
  respecFreeAllowance: 1,
  respecCost: 60,
  respecRefundPercent: 75,
};

export const olympusChampion: IOlympusChampion = {
  id: "gennvim",
  arenaOpponentId: "training-tier-1",
  requiredTier: 1,
  requiredLadderPosition: 1,
  baseDeckVariantId: "starter-tools",
  baseScale: { level: 14, versionTier: 2, startingLp: 8000 },
  version: 1,
};

export const olympusNode: IOlympusUpgradeNode = {
  id: "gennvim-power-1",
  championId: "gennvim",
  branch: "POWER",
  prerequisiteNodeIds: [],
  effect: { kind: "GLOBAL_LEVEL", amount: 5, cap: 30 },
  fragmentCost: 40,
  maxRank: 16,
  sortOrder: 10,
};

export const olympusLegend: IOlympusLegend = {
  id: "zeus",
  code: "ZEUS",
  displayName: "Zeus",
  deckTemplateId: "gokernel-ultra",
  aiProfile: "MYTHIC",
  startingLp: 14000,
  energyBonus: 2,
  rewardDefinitionId: "olympus-v1-zeus",
  avatarPath: "/assets/combat/olympus/opponents/zeus/avatar.webp",
  introPath: null,
  victoryPath: null,
  defeatPath: null,
  lore: null,
  specialRules: [],
  nexusReward: 300,
  cardRewardId: "fusion-gemgpt",
  cardRewardFirstVictoryOnly: true,
  baseFragmentReward: 150,
  firstVictoryFragmentBonus: 400,
  defeatFragmentReward: 20,
  sortOrder: 10,
  version: 1,
};

export const olympusCatalog: IOlympusCatalog = {
  settings: olympusSettings,
  champions: [olympusChampion],
  nodes: [olympusNode],
  legends: [olympusLegend],
};

export const olympusProgress: IOlympusChampionProgress = {
  championId: "gennvim",
  unlockedNodeIds: [],
  nodeRanks: {},
  respecCount: 0,
  version: 1,
};

export const olympusBattle: IOlympusBattle = {
  battleId: "battle-1",
  playerId: "player-1",
  championId: "gennvim",
  opponentId: "zeus",
  periodKey: "2026-07-31",
  attemptNumber: 1,
  status: "ISSUED",
  outcome: null,
  reward: null,
};
