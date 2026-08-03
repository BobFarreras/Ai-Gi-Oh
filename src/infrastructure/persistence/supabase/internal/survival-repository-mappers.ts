// src/infrastructure/persistence/supabase/internal/survival-repository-mappers.ts - Traduce filas Supabase al dominio Survival.
import {
  ISurvivalBattle,
  ISurvivalRuleset,
  ISurvivalRun,
  ISurvivalScalingStage,
} from "@/core/entities/survival/ISurvival";

type Row = Record<string, unknown>;
const numberValue = (value: unknown): number => Number(value);
const stringValue = (value: unknown): string => String(value);

/** Convierte la definición persistida y rechaza implícitamente formas no utilizables en la capa de aplicación. */
export function mapSurvivalRuleset(row: Row): ISurvivalRuleset {
  return {
    id: stringValue(row.id),
    version: numberValue(row.version),
    startTier: numberValue(row.start_tier),
    battlesPerTier: numberValue(row.battles_per_tier),
    roster: Array.isArray(row.roster_json) ? row.roster_json.filter((id): id is string => typeof id === "string") : [],
    milestoneInterval: numberValue(row.milestone_interval),
    milestoneHeal: numberValue(row.milestone_heal),
  };
}

export function mapSurvivalStage(row: Row): ISurvivalScalingStage {
  const cardScale = row.card_scale_json as Row | null;
  const ascension = row.ascension_modifiers_json as Row | null;
  return {
    fromBattle: numberValue(row.from_battle),
    aiProfile: stringValue(row.ai_profile) as ISurvivalScalingStage["aiProfile"],
    maxTier: numberValue(cardScale?.maxTier ?? 8),
    maxLpBonus: numberValue(ascension?.maxLpBonus ?? 0),
    statBonusPerRank: numberValue(ascension?.statBonusPerRank ?? 0),
    rewardDefinitionId: stringValue(row.reward_definition_id),
  };
}

export function mapSurvivalRun(row: Row): ISurvivalRun {
  return {
    id: stringValue(row.id),
    playerId: stringValue(row.player_id),
    status: stringValue(row.status) as ISurvivalRun["status"],
    currentLp: numberValue(row.current_lp),
    maxLp: numberValue(row.max_lp),
    wins: numberValue(row.wins),
    currentBattleIndex: numberValue(row.current_battle_index),
    rulesetVersion: numberValue(row.ruleset_version),
    startedAtIso: stringValue(row.started_at),
    completedAtIso: typeof row.completed_at === "string" ? row.completed_at : null,
    version: numberValue(row.version),
  };
}

export function mapSurvivalBattle(row: Row): ISurvivalBattle {
  const reward = row.reward_json && typeof row.reward_json === "object"
    ? row.reward_json as Row
    : null;
  return {
    battleId: stringValue(row.battle_id),
    runId: stringValue(row.run_id),
    battleIndex: numberValue(row.battle_index),
    opponentId: stringValue(row.opponent_id),
    effectiveTier: numberValue(row.effective_tier),
    ascensionRank: numberValue(row.ascension_rank),
    startingLp: numberValue(row.starting_lp),
    endingLp: row.ending_lp === null ? null : numberValue(row.ending_lp),
    status: stringValue(row.status) as ISurvivalBattle["status"],
    outcome: row.outcome === null ? null : stringValue(row.outcome) as ISurvivalBattle["outcome"],
    milestoneHeal: numberValue(row.milestone_heal),
    reward: reward ? {
      ascensionFragments: numberValue(reward.ascensionFragments ?? reward.fragments ?? 0),
      definitionId: stringValue(reward.definitionId ?? "legacy"),
      milestoneReached: Boolean(reward.milestoneReached),
    } : null,
  };
}
