// src/core/repositories/IOlympusRepository.ts - Puerto de persistencia para catálogo, economía y batallas de Olimpo.
import {
  IOlympusBattle,
  IOlympusChampion,
  IOlympusChampionProgress,
  IOlympusLegend,
  IOlympusReward,
  IOlympusSettings,
  IOlympusUpgradeNode,
  OlympusOutcome,
} from "@/core/entities/olympus/IOlympus";
import { IOlympusDailyUsage } from "@/core/services/olympus/resolve-olympus-allowance";
import { ICombatJournalEntry, ICombatSession } from "@/core/entities/match";
import { GameState } from "@/core/use-cases/GameEngine";

export interface IIssueOlympusBattleInput {
  playerId: string;
  battleId: string;
  championId: string;
  opponentId: string;
  seed: string;
  snapshotHash: string;
  snapshot: GameState;
  protocolVersion: number;
  championSnapshotHash: string;
  opponentSnapshotHash: string;
  expiresAtIso: string;
}

export interface ICompleteOlympusBattleInput {
  playerId: string;
  battleId: string;
  outcome: OlympusOutcome;
  reward: IOlympusReward;
  fragmentAmount: number;
  /** Nexus y carta viajan aparte del `reward`: son los importes que la RPC aplica de verdad. */
  nexusAmount: number;
  cardRewardId: string | null;
}

export interface IOlympusCatalog {
  settings: IOlympusSettings;
  champions: IOlympusChampion[];
  nodes: IOlympusUpgradeNode[];
  legends: IOlympusLegend[];
}

export interface IOlympusRepository {
  getCatalog(): Promise<IOlympusCatalog>;
  getLegendDeckEntries(opponentId: string): Promise<IOlympusLegendDeckEntry[]>;
  getUnlockedChampionIds(playerId: string): Promise<string[]>;
  getChampionProgress(playerId: string): Promise<IOlympusChampionProgress[]>;
  getDailyUsage(playerId: string, periodKey: string): Promise<IOlympusDailyUsage | null>;
  getFragmentBalance(playerId: string): Promise<number>;
  getDefeatedLegendIds(playerId: string): Promise<string[]>;
  getIssuedBattle(playerId: string): Promise<IOlympusBattle | null>;
  getBattleById(playerId: string, battleId: string): Promise<IOlympusBattle | null>;
  getCombatSession(
    playerId: string,
    battleId: string,
  ): Promise<{ session: ICombatSession; snapshot: GameState; journalEntries: ICombatJournalEntry[] } | null>;
  /** Persiste el journal en curso; el historial solo crece y devuelve su longitud efectiva. */
  saveJournalCheckpoint(playerId: string, battleId: string, entries: ICombatJournalEntry[]): Promise<number>;
  purchaseUpgrade(playerId: string, championId: string, nodeId: string, operationId: string): Promise<number>;
  respecUpgrades(playerId: string, championId: string, operationId: string): Promise<number>;
  issueBattle(input: IIssueOlympusBattleInput): Promise<IOlympusBattle>;
  /** Reemite sin castigo un snapshot incompatible y devuelve el intento consumido. */
  invalidateIssuedBattle(playerId: string, battleId: string): Promise<void>;
  /** Cierra como derrota una batalla jugable abandonada; el intento ya está gastado. */
  forfeitIssuedBattle(playerId: string, battleId: string): Promise<IOlympusBattle>;
  completeBattle(input: ICompleteOlympusBattleInput): Promise<IOlympusBattle>;
}

export interface IOlympusLegendDeckEntry {
  zone: "DECK" | "FUSION";
  position: number;
  cardId: string;
  level: number;
  xp: number;
  versionTier: number;
  attackBonus: number;
  defenseBonus: number;
}
