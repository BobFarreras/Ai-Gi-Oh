// src/core/entities/olympus/IOlympus.ts - Contratos del agregado autoritativo de Olimpo.
export type OlympusBattleStatus = "ISSUED" | "COMPLETED" | "EXPIRED";
export type OlympusOutcome = "WIN" | "LOSS" | "DRAW";
export type OlympusAiProfile = "MASTER" | "MYTHIC";
export type OlympusUpgradeBranch = "POWER" | "RESILIENCE" | "IDENTITY";

/** Configuración versionada del modo: intentos, caducidad y economía del respec. */
export interface IOlympusSettings {
  version: number;
  dailyAttemptLimit: number;
  battleTtlMinutes: number;
  respecFreeAllowance: number;
  respecCost: number;
  respecRefundPercent: number;
}

/** Escala de partida del deck prestado, antes de aplicar los nodos comprados. */
export interface IOlympusChampionBaseScale {
  level: number;
  versionTier: number;
  startingLp: number;
}

export interface IOlympusChampion {
  id: string;
  arenaOpponentId: string;
  requiredTier: number;
  requiredLadderPosition: number;
  baseDeckVariantId: string;
  baseScale: IOlympusChampionBaseScale;
  version: number;
}

/**
 * Efecto declarativo de un nodo. `cap` es el techo absoluto del atributo, no el incremento,
 * y varios nodos que tocan el mismo atributo comparten el cap más restrictivo.
 */
export type IOlympusUpgradeEffect =
  | { kind: "GLOBAL_LEVEL"; amount: number; cap: number }
  | { kind: "GLOBAL_VERSION_TIER"; amount: number; cap: number }
  | { kind: "SIGNATURE_CARD_LEVEL"; amount: number; cap: number; cardIds?: string[] }
  | { kind: "STARTING_LP"; amount: number; cap: number }
  | { kind: "STARTING_ENERGY"; amount: number; cap: number };

export interface IOlympusUpgradeNode {
  id: string;
  championId: string;
  branch: OlympusUpgradeBranch;
  prerequisiteNodeIds: string[];
  effect: IOlympusUpgradeEffect;
  fragmentCost: number;
  sortOrder: number;
}

export interface IOlympusLegend {
  id: string;
  code: string;
  displayName: string;
  deckTemplateId: string;
  aiProfile: OlympusAiProfile;
  startingLp: number;
  energyBonus: number;
  rewardDefinitionId: string;
  avatarPath: string | null;
  introPath: string | null;
  victoryPath: string | null;
  defeatPath: string | null;
  lore: string | null;
  specialRules: string[];
  baseFragmentReward: number;
  firstVictoryFragmentBonus: number;
  defeatFragmentReward: number;
  sortOrder: number;
  version: number;
}

export interface IOlympusChampionProgress {
  championId: string;
  unlockedNodeIds: string[];
  respecCount: number;
  version: number;
}

export interface IOlympusAllowance {
  periodKey: string;
  attemptsUsed: number;
  dailyLimit: number;
  attemptsRemaining: number;
  nextResetIso: string;
}

export interface IOlympusReward {
  ascensionFragments: number;
  definitionId: string;
  firstVictory: boolean;
}

export interface IOlympusBattle {
  battleId: string;
  playerId: string;
  championId: string;
  opponentId: string;
  periodKey: string;
  attemptNumber: number;
  status: OlympusBattleStatus;
  outcome: OlympusOutcome | null;
  reward: IOlympusReward | null;
}

/** Estado por campeón que consume la UI: catálogo, desbloqueo y árbol comprado. */
export interface IOlympusChampionState {
  champion: IOlympusChampion;
  nodes: IOlympusUpgradeNode[];
  progress: IOlympusChampionProgress | null;
  unlocked: boolean;
}
