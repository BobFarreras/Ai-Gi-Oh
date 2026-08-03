// src/infrastructure/persistence/supabase/internal/olympus-repository-mappers.test.ts - Verifica la traducción de filas de Olimpo y el rechazo de efectos no soportados.
import { describe, expect, it } from "vitest";
import {
  mapOlympusBattle,
  mapOlympusChampion,
  mapOlympusLegend,
  mapOlympusSettings,
  mapOlympusUpgradeNode,
} from "./olympus-repository-mappers";

describe("olympus-repository-mappers", () => {
  it("traduce la configuración versionada", () => {
    expect(mapOlympusSettings({
      version: 1, daily_attempt_limit: 3, battle_ttl_minutes: 45,
      respec_free_allowance: 1, respec_cost: 60, respec_refund_percent: 75,
    })).toEqual({
      version: 1, dailyAttemptLimit: 3, battleTtlMinutes: 45,
      respecFreeAllowance: 1, respecCost: 60, respecRefundPercent: 75,
    });
  });

  it("aplica valores por defecto cuando la escala base viene incompleta", () => {
    const champion = mapOlympusChampion({
      id: "gennvim", arena_opponent_id: "training-tier-1", required_tier: 1,
      required_ladder_position: 1, base_deck_variant_id: "starter-tools",
      base_scale_json: { level: 14 }, version: 1,
    });
    expect(champion.baseScale).toEqual({ level: 14, versionTier: 0, startingLp: 8000 });
  });

  it("conserva el selector de cartas emblemáticas", () => {
    const node = mapOlympusUpgradeNode({
      id: "gennvim-identity-1", champion_id: "gennvim", branch: "IDENTITY",
      prerequisite_node_ids: ["gennvim-power-1"],
      effect_json: { kind: "SIGNATURE_CARD_LEVEL", amount: 5, cap: 30, cardIds: ["entity-claude"] },
      fragment_cost: 60, sort_order: 30,
    });
    expect(node.effect).toEqual({
      kind: "SIGNATURE_CARD_LEVEL", amount: 5, cap: 30, cardIds: ["entity-claude"],
    });
  });

  it("rechaza un efecto que el resolutor no sabe aplicar en vez de ignorarlo", () => {
    expect(() => mapOlympusUpgradeNode({
      id: "gennvim-mistery-1", champion_id: "gennvim", branch: "POWER",
      prerequisite_node_ids: [], effect_json: { kind: "TELEPORT", amount: 1, cap: 1 },
      fragment_cost: 10, sort_order: 40,
    })).toThrow(/efecto no soportado/i);
  });

  it("extrae LP y bonus de energía de los modificadores de combate", () => {
    const legend = mapOlympusLegend({
      id: "zeus", code: "ZEUS", display_name: "Zeus", deck_template_id: "gokernel-ultra",
      ai_profile: "MYTHIC", combat_modifiers_json: { startingLp: 14000, energyBonus: 2 },
      reward_definition_id: "olympus-v1-zeus", avatar_path: "/assets/combat/olympus/opponents/zeus/avatar.webp",
      intro_path: null, victory_path: null, defeat_path: null, lore: null,
      special_rules_json: ["Comienza con 14.000 LP", 7],
      base_fragment_reward: 150, first_victory_fragment_bonus: 400,
      defeat_fragment_reward: 20, sort_order: 10, version: 1,
    });
    expect(legend).toMatchObject({
      startingLp: 14000,
      energyBonus: 2,
      introPath: null,
      specialRules: ["Comienza con 14.000 LP"],
    });
  });

  it("normaliza una batalla aún sin desenlace", () => {
    const battle = mapOlympusBattle({
      battle_id: "battle-1", player_id: "player-1", champion_id: "gennvim", opponent_id: "zeus",
      period_key: "2026-07-31", attempt_number: 1, status: "ISSUED",
      outcome: null, reward_json: null,
    });
    expect(battle).toMatchObject({ status: "ISSUED", outcome: null, reward: null });
  });
});
