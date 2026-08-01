// src/infrastructure/persistence/supabase/internal/olympus-repository-mappers.ts - Traduce filas Supabase al dominio de Olimpo.
import {
  IOlympusBattle,
  IOlympusChampion,
  IOlympusChampionProgress,
  IOlympusLegend,
  IOlympusUpgradeEffect,
  IOlympusUpgradeNode,
  IOlympusSettings,
} from "@/core/entities/olympus/IOlympus";
import { IOlympusLegendDeckEntry } from "@/core/repositories/IOlympusRepository";
import { ValidationError } from "@/core/errors/ValidationError";

type Row = Record<string, unknown>;
const numberValue = (value: unknown): number => Number(value);
const stringValue = (value: unknown): string => String(value);
const optionalString = (value: unknown): string | null => (typeof value === "string" ? value : null);

const KNOWN_EFFECT_KINDS = new Set<IOlympusUpgradeEffect["kind"]>([
  "GLOBAL_LEVEL", "GLOBAL_VERSION_TIER", "SIGNATURE_CARD_LEVEL", "STARTING_LP", "STARTING_ENERGY",
]);

export function mapOlympusSettings(row: Row): IOlympusSettings {
  return {
    version: numberValue(row.version),
    dailyAttemptLimit: numberValue(row.daily_attempt_limit),
    battleTtlMinutes: numberValue(row.battle_ttl_minutes),
    respecFreeAllowance: numberValue(row.respec_free_allowance),
    respecCost: numberValue(row.respec_cost),
    respecRefundPercent: numberValue(row.respec_refund_percent),
  };
}

export function mapOlympusChampion(row: Row): IOlympusChampion {
  const scale = (row.base_scale_json ?? {}) as Row;
  return {
    id: stringValue(row.id),
    arenaOpponentId: stringValue(row.arena_opponent_id),
    requiredTier: numberValue(row.required_tier),
    requiredLadderPosition: numberValue(row.required_ladder_position),
    baseDeckVariantId: stringValue(row.base_deck_variant_id),
    baseScale: {
      level: numberValue(scale.level ?? 0),
      versionTier: numberValue(scale.versionTier ?? 0),
      startingLp: numberValue(scale.startingLp ?? 8000),
    },
    version: numberValue(row.version),
  };
}

/**
 * Un efecto que el resolutor no sabe aplicar no se ignora en silencio: dejarlo pasar convertiría un
 * nodo pagado en decoración. El panel admin debe publicar solo tipos soportados.
 */
function mapUpgradeEffect(value: unknown, nodeId: string): IOlympusUpgradeEffect {
  const effect = (value ?? {}) as Row;
  const kind = stringValue(effect.kind) as IOlympusUpgradeEffect["kind"];
  if (!KNOWN_EFFECT_KINDS.has(kind)) {
    throw new ValidationError(`El nodo ${nodeId} declara un efecto no soportado.`);
  }
  const base = { amount: numberValue(effect.amount ?? 0), cap: numberValue(effect.cap ?? 0) };
  if (kind !== "SIGNATURE_CARD_LEVEL") return { kind, ...base };
  const cardIds = Array.isArray(effect.cardIds)
    ? effect.cardIds.filter((id): id is string => typeof id === "string")
    : undefined;
  return { kind, ...base, ...(cardIds && cardIds.length > 0 ? { cardIds } : {}) };
}

export function mapOlympusUpgradeNode(row: Row): IOlympusUpgradeNode {
  const id = stringValue(row.id);
  return {
    id,
    championId: stringValue(row.champion_id),
    branch: stringValue(row.branch) as IOlympusUpgradeNode["branch"],
    prerequisiteNodeIds: Array.isArray(row.prerequisite_node_ids)
      ? row.prerequisite_node_ids.filter((value): value is string => typeof value === "string")
      : [],
    effect: mapUpgradeEffect(row.effect_json, id),
    fragmentCost: numberValue(row.fragment_cost),
    sortOrder: numberValue(row.sort_order),
  };
}

export function mapOlympusLegend(row: Row): IOlympusLegend {
  const modifiers = (row.combat_modifiers_json ?? {}) as Row;
  return {
    id: stringValue(row.id),
    code: stringValue(row.code),
    displayName: stringValue(row.display_name),
    deckTemplateId: stringValue(row.deck_template_id),
    aiProfile: stringValue(row.ai_profile) as IOlympusLegend["aiProfile"],
    startingLp: numberValue(modifiers.startingLp ?? 8000),
    energyBonus: numberValue(modifiers.energyBonus ?? 0),
    rewardDefinitionId: stringValue(row.reward_definition_id),
    avatarPath: optionalString(row.avatar_path),
    introPath: optionalString(row.intro_path),
    victoryPath: optionalString(row.victory_path),
    defeatPath: optionalString(row.defeat_path),
    lore: optionalString(row.lore),
    specialRules: Array.isArray(row.special_rules_json)
      ? row.special_rules_json.filter((rule): rule is string => typeof rule === "string")
      : [],
    baseFragmentReward: numberValue(row.base_fragment_reward),
    firstVictoryFragmentBonus: numberValue(row.first_victory_fragment_bonus),
    defeatFragmentReward: numberValue(row.defeat_fragment_reward),
    sortOrder: numberValue(row.sort_order),
    version: numberValue(row.version),
  };
}

export function mapOlympusLegendDeckEntry(row: Row): IOlympusLegendDeckEntry {
  return {
    zone: stringValue(row.zone) as IOlympusLegendDeckEntry["zone"],
    position: numberValue(row.position),
    cardId: stringValue(row.card_id),
    level: numberValue(row.level),
    xp: numberValue(row.xp),
    versionTier: numberValue(row.version_tier),
    attackBonus: numberValue(row.attack_bonus),
    defenseBonus: numberValue(row.defense_bonus),
  };
}

export function mapOlympusChampionProgress(row: Row): IOlympusChampionProgress {
  return {
    championId: stringValue(row.champion_id),
    unlockedNodeIds: Array.isArray(row.unlocked_node_ids)
      ? row.unlocked_node_ids.filter((id): id is string => typeof id === "string")
      : [],
    respecCount: numberValue(row.respec_count),
    version: numberValue(row.version),
  };
}

export function mapOlympusBattle(row: Row): IOlympusBattle {
  const reward = row.reward_json && typeof row.reward_json === "object" ? row.reward_json as Row : null;
  return {
    battleId: stringValue(row.battle_id),
    playerId: stringValue(row.player_id),
    championId: stringValue(row.champion_id),
    opponentId: stringValue(row.opponent_id),
    periodKey: stringValue(row.period_key),
    attemptNumber: numberValue(row.attempt_number),
    status: stringValue(row.status) as IOlympusBattle["status"],
    outcome: row.outcome === null || row.outcome === undefined
      ? null
      : stringValue(row.outcome) as IOlympusBattle["outcome"],
    reward: reward ? {
      ascensionFragments: numberValue(reward.ascensionFragments ?? 0),
      definitionId: stringValue(reward.definitionId ?? "legacy"),
      firstVictory: Boolean(reward.firstVictory),
    } : null,
  };
}
