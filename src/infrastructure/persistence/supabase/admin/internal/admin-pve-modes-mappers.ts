// src/infrastructure/persistence/supabase/admin/internal/admin-pve-modes-mappers.ts - Traduce filas PvE a los DTO del panel admin.
import {
  IAdminOlympusChampion,
  IAdminOlympusLegend,
  IAdminOlympusSettings,
  IAdminOlympusUpgradeNode,
  IAdminPveArenaOpponentRef,
  IAdminSurvivalRuleset,
  IAdminSurvivalStage,
} from "@/core/entities/admin/IAdminPveModes";

export type Row = Record<string, unknown>;

const num = (value: unknown, fallback = 0): number => (value === null || value === undefined ? fallback : Number(value));
const str = (value: unknown): string => String(value ?? "");
const optStr = (value: unknown): string | null => (typeof value === "string" ? value : null);
const strList = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];

export function mapAdminSurvivalStage(row: Row): IAdminSurvivalStage {
  const cardScale = (row.card_scale_json ?? {}) as Row;
  const ascension = (row.ascension_modifiers_json ?? {}) as Row;
  return {
    fromBattle: num(row.from_battle),
    aiProfile: str(row.ai_profile) as IAdminSurvivalStage["aiProfile"],
    maxTier: num(cardScale.maxTier, 8),
    maxLpBonus: num(ascension.maxLpBonus),
    statBonusPerRank: num(ascension.statBonusPerRank),
    rewardDefinitionId: str(row.reward_definition_id),
  };
}

export function mapAdminSurvivalRuleset(row: Row, stages: IAdminSurvivalStage[]): IAdminSurvivalRuleset {
  return {
    version: num(row.version),
    startTier: num(row.start_tier),
    battlesPerTier: num(row.battles_per_tier),
    roster: strList(row.roster_json),
    milestoneInterval: num(row.milestone_interval),
    milestoneHeal: num(row.milestone_heal),
    isActive: row.is_active === true,
    publishedAtIso: str(row.published_at),
    stages: [...stages].sort((left, right) => left.fromBattle - right.fromBattle),
  };
}

export function mapAdminOlympusSettings(row: Row): IAdminOlympusSettings {
  return {
    version: num(row.version),
    dailyAttemptLimit: num(row.daily_attempt_limit),
    battleTtlMinutes: num(row.battle_ttl_minutes),
    respecFreeAllowance: num(row.respec_free_allowance),
    respecCost: num(row.respec_cost),
    respecRefundPercent: num(row.respec_refund_percent),
    isActive: row.is_active === true,
    publishedAtIso: str(row.published_at),
  };
}

export function mapAdminOlympusLegend(row: Row, deckRows: Row[]): IAdminOlympusLegend {
  const modifiers = (row.combat_modifiers_json ?? {}) as Row;
  const toEntry = (entry: Row) => ({
    cardId: str(entry.card_id),
    versionTier: num(entry.version_tier),
    level: num(entry.level),
    xp: num(entry.xp),
    attackBonus: num(entry.attack_bonus),
    defenseBonus: num(entry.defense_bonus),
  });
  const byZone = (zone: string) => deckRows
    .filter((entry) => str(entry.zone) === zone)
    .sort((left, right) => num(left.position) - num(right.position))
    .map(toEntry);
  return {
    id: str(row.id),
    code: str(row.code),
    displayName: str(row.display_name),
    deckTemplateId: str(row.deck_template_id),
    aiProfile: str(row.ai_profile) as IAdminOlympusLegend["aiProfile"],
    startingLp: num(modifiers.startingLp, 8000),
    energyBonus: num(modifiers.energyBonus),
    rewardDefinitionId: str(row.reward_definition_id),
    avatarPath: optStr(row.avatar_path),
    introPath: optStr(row.intro_path),
    victoryPath: optStr(row.victory_path),
    defeatPath: optStr(row.defeat_path),
    lore: optStr(row.lore),
    specialRules: strList(row.special_rules_json),
    baseFragmentReward: num(row.base_fragment_reward),
    firstVictoryFragmentBonus: num(row.first_victory_fragment_bonus),
    defeatFragmentReward: num(row.defeat_fragment_reward),
    availableFromIso: optStr(row.available_from),
    availableUntilIso: optStr(row.available_until),
    isActive: row.is_active === true,
    sortOrder: num(row.sort_order),
    version: num(row.version),
    deckCards: byZone("DECK"),
    fusionCards: byZone("FUSION"),
  };
}

export function mapAdminOlympusNode(row: Row): IAdminOlympusUpgradeNode {
  const effect = (row.effect_json ?? {}) as Row;
  return {
    id: str(row.id),
    championId: str(row.champion_id),
    branch: str(row.branch) as IAdminOlympusUpgradeNode["branch"],
    prerequisiteNodeIds: strList(row.prerequisite_node_ids),
    effectKind: str(effect.kind),
    effectAmount: num(effect.amount),
    effectCap: num(effect.cap),
    effectCardIds: strList(effect.cardIds),
    fragmentCost: num(row.fragment_cost),
    sortOrder: num(row.sort_order),
    isActive: row.is_active === true,
    version: num(row.version),
  };
}

/**
 * Agrupa las variantes bajo su rival. El campeón presta el mazo de SU rival, así que el panel necesita
 * saber a quién pertenece cada variante para no ofrecer combinaciones que romperían la emisión.
 */
export function mapArenaOpponentRefs(
  opponentRows: Row[],
  variantRows: Row[],
  variantCardRows: Row[],
): IAdminPveArenaOpponentRef[] {
  const counts = new Map<string, { deck: number; fusion: number }>();
  for (const card of variantCardRows) {
    const key = str(card.variant_id);
    const current = counts.get(key) ?? { deck: 0, fusion: 0 };
    if (str(card.zone) === "FUSION") current.fusion += 1;
    else current.deck += 1;
    counts.set(key, current);
  }
  return opponentRows.map((opponent) => {
    const id = str(opponent.id);
    return {
      id,
      displayName: str(opponent.display_name),
      avatarUrl: str(opponent.avatar_url),
      variants: variantRows
        .filter((variant) => str(variant.opponent_id) === id)
        .map((variant) => {
          const variantId = str(variant.id);
          const count = counts.get(variantId) ?? { deck: 0, fusion: 0 };
          return {
            id: variantId,
            label: optStr(variant.label),
            deckCount: count.deck,
            fusionCount: count.fusion,
          };
        }),
    };
  });
}

export function mapAdminOlympusChampion(row: Row, nodes: IAdminOlympusUpgradeNode[]): IAdminOlympusChampion {
  const scale = (row.base_scale_json ?? {}) as Row;
  return {
    id: str(row.id),
    arenaOpponentId: str(row.arena_opponent_id),
    requiredTier: num(row.required_tier),
    requiredLadderPosition: num(row.required_ladder_position),
    baseDeckVariantId: str(row.base_deck_variant_id),
    baseLevel: num(scale.level),
    baseVersionTier: num(scale.versionTier),
    baseStartingLp: num(scale.startingLp, 8000),
    isActive: row.is_active === true,
    version: num(row.version),
    nodes: [...nodes].sort((left, right) => left.sortOrder - right.sortOrder),
  };
}
