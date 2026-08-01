// src/core/entities/admin/IAdminPveModes.ts - Contratos del panel admin de Supervivencia y Olimpo.
import { IAdminArenaCardEntry } from "@/core/entities/training/IAdminArena";
import { IOlympusUpgradeBranch } from "./IAdminPveModes.types";

export type { IOlympusUpgradeBranch };

/** Tramo de escalado de una expedición: perfil de IA, techo de tier y modificadores de Ascensión. */
export interface IAdminSurvivalStage {
  fromBattle: number;
  aiProfile: "HARD" | "BOSS" | "MASTER" | "MYTHIC";
  maxTier: number;
  maxLpBonus: number;
  statBonusPerRank: number;
  rewardDefinitionId: string;
}

export interface IAdminSurvivalRuleset {
  version: number;
  startTier: number;
  battlesPerTier: number;
  roster: string[];
  milestoneInterval: number;
  milestoneHeal: number;
  isActive: boolean;
  publishedAtIso: string;
  stages: IAdminSurvivalStage[];
}

export interface IAdminOlympusSettings {
  version: number;
  dailyAttemptLimit: number;
  battleTtlMinutes: number;
  respecFreeAllowance: number;
  respecCost: number;
  respecRefundPercent: number;
  isActive: boolean;
  publishedAtIso: string;
}

export interface IAdminOlympusLegend {
  id: string;
  code: string;
  displayName: string;
  deckTemplateId: string;
  aiProfile: "MASTER" | "MYTHIC";
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
  availableFromIso: string | null;
  availableUntilIso: string | null;
  isActive: boolean;
  sortOrder: number;
  version: number;
  /** Deck legendario versionado, con la misma forma que las cartas de Arena para reutilizar su editor. */
  deckCards: IAdminArenaCardEntry[];
  fusionCards: IAdminArenaCardEntry[];
}

export interface IAdminOlympusUpgradeNode {
  id: string;
  championId: string;
  branch: IOlympusUpgradeBranch;
  prerequisiteNodeIds: string[];
  effectKind: string;
  effectAmount: number;
  effectCap: number;
  effectCardIds: string[];
  fragmentCost: number;
  sortOrder: number;
  isActive: boolean;
  version: number;
}

export interface IAdminOlympusChampion {
  id: string;
  arenaOpponentId: string;
  requiredTier: number;
  requiredLadderPosition: number;
  baseDeckVariantId: string;
  baseLevel: number;
  baseVersionTier: number;
  baseStartingLp: number;
  isActive: boolean;
  version: number;
  nodes: IAdminOlympusUpgradeNode[];
}

/** Instantánea completa que consume el panel; una sola lectura evita cascadas de fetch en la UI. */
export interface IAdminPveModesSnapshot {
  survivalRulesets: IAdminSurvivalRuleset[];
  olympusSettings: IAdminOlympusSettings[];
  legends: IAdminOlympusLegend[];
  champions: IAdminOlympusChampion[];
  /** Ids de rivales de Arena y sus variantes, para enlazar campeones y decks legendarios sin inventar ids. */
  arenaDeckVariantIds: string[];
  arenaOpponentIds: string[];
}

export interface IPublishSurvivalRulesetCommand {
  startTier: number;
  battlesPerTier: number;
  roster: string[];
  milestoneInterval: number;
  milestoneHeal: number;
  stages: IAdminSurvivalStage[];
}

export interface IPublishOlympusSettingsCommand {
  dailyAttemptLimit: number;
  battleTtlMinutes: number;
  respecFreeAllowance: number;
  respecCost: number;
  respecRefundPercent: number;
}

export type IUpsertOlympusLegendCommand = Omit<IAdminOlympusLegend, "version">;
export type IUpsertOlympusChampionCommand = Omit<IAdminOlympusChampion, "version" | "nodes">;
export type IUpsertOlympusNodeCommand = Omit<IAdminOlympusUpgradeNode, "version">;
