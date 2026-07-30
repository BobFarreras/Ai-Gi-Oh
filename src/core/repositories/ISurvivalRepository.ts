// src/core/repositories/ISurvivalRepository.ts - Puerto de persistencia para runs y batallas de Supervivencia.
import {
  ISurvivalBattle,
  ISurvivalRuleset,
  ISurvivalRun,
  ISurvivalScalingStage,
  SurvivalOutcome,
} from "@/core/entities/survival/ISurvival";
import { ICombatSession } from "@/core/entities/match";
import { GameState } from "@/core/use-cases/GameEngine";

export interface IIssueSurvivalBattleInput {
  playerId: string;
  runId: string;
  battleId: string;
  opponentId: string;
  effectiveTier: number;
  ascensionRank: number;
  seed: string;
  snapshotHash: string;
  snapshot: GameState;
  protocolVersion: number;
  expiresAtIso: string;
}

export interface ICompleteSurvivalBattleInput {
  playerId: string;
  battleId: string;
  outcome: SurvivalOutcome;
  endingLp: number;
  reward: Record<string, unknown>;
  fragmentAmount: number;
}

export interface ISurvivalRepository {
  getRuleset(version?: number): Promise<{ ruleset: ISurvivalRuleset; stages: ISurvivalScalingStage[] } | null>;
  getActiveRun(playerId: string): Promise<ISurvivalRun | null>;
  getRunById(playerId: string, runId: string): Promise<ISurvivalRun | null>;
  getIssuedBattle(runId: string): Promise<ISurvivalBattle | null>;
  getBattleById(playerId: string, battleId: string): Promise<ISurvivalBattle | null>;
  getCombatSession(playerId: string, battleId: string): Promise<{ session: ICombatSession; snapshot: GameState } | null>;
  startRun(playerId: string, maxLp: number, rulesetVersion: number): Promise<ISurvivalRun>;
  issueBattle(input: IIssueSurvivalBattleInput): Promise<ISurvivalBattle>;
  invalidateIssuedBattle(playerId: string, battleId: string): Promise<void>;
  completeBattle(input: ICompleteSurvivalBattleInput): Promise<ISurvivalRun>;
}
