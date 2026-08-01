// src/infrastructure/persistence/supabase/admin/internal/admin-pve-modes-mappers.test.ts - Verifica la traducción de filas PvE al panel admin.
import { describe, expect, it } from "vitest";
import {
  mapAdminOlympusChampion,
  mapAdminOlympusLegend,
  mapAdminOlympusNode,
  mapAdminSurvivalRuleset,
  mapAdminSurvivalStage,
} from "./admin-pve-modes-mappers";

describe("admin-pve-modes-mappers", () => {
  it("extrae el escalado de sus dos objetos JSON", () => {
    const stage = mapAdminSurvivalStage({
      from_battle: 5, ai_profile: "BOSS", reward_definition_id: "survival-boss",
      card_scale_json: { maxTier: 8 }, ascension_modifiers_json: { maxLpBonus: 1000, statBonusPerRank: 175 },
    });
    expect(stage).toEqual({
      fromBattle: 5, aiProfile: "BOSS", maxTier: 8,
      maxLpBonus: 1000, statBonusPerRank: 175, rewardDefinitionId: "survival-boss",
    });
  });

  it("ordena los tramos del ruleset por combate inicial", () => {
    const ruleset = mapAdminSurvivalRuleset(
      {
        version: 1, start_tier: 4, battles_per_tier: 2, roster_json: ["a", 7, "b"],
        milestone_interval: 5, milestone_heal: 2000, is_active: true, published_at: "2026-07-31T10:00:00Z",
      },
      [
        { fromBattle: 11, aiProfile: "MYTHIC", maxTier: 8, maxLpBonus: 0, statBonusPerRank: 0, rewardDefinitionId: "c" },
        { fromBattle: 1, aiProfile: "HARD", maxTier: 5, maxLpBonus: 0, statBonusPerRank: 0, rewardDefinitionId: "a" },
      ],
    );
    expect(ruleset.stages.map((stage) => stage.fromBattle)).toEqual([1, 11]);
    // El roster descarta entradas que no son ids: una fila corrupta no debe romper el panel.
    expect(ruleset.roster).toEqual(["a", "b"]);
  });

  it("separa el deck legendario por zona y respeta la posición", () => {
    const legend = mapAdminOlympusLegend(
      {
        id: "zeus", code: "ZEUS", display_name: "Zeus", deck_template_id: "gokernel-ultra",
        ai_profile: "MYTHIC", combat_modifiers_json: { startingLp: 14000, energyBonus: 2 },
        reward_definition_id: "olympus-v1-zeus", avatar_path: "/a.webp", intro_path: null,
        victory_path: null, defeat_path: null, lore: null, special_rules_json: ["Regla"],
        base_fragment_reward: 150, first_victory_fragment_bonus: 400, defeat_fragment_reward: 20,
        available_from: null, available_until: null, is_active: true, sort_order: 10, version: 3,
      },
      [
        { zone: "DECK", position: 2, card_id: "b", level: 30, xp: 9800, version_tier: 5, attack_bonus: 300, defense_bonus: 200 },
        { zone: "FUSION", position: 1, card_id: "f", level: 30, xp: 9800, version_tier: 5, attack_bonus: 0, defense_bonus: 0 },
        { zone: "DECK", position: 1, card_id: "a", level: 30, xp: 9800, version_tier: 5, attack_bonus: 300, defense_bonus: 200 },
      ],
    );
    expect(legend.deckCards.map((entry) => entry.cardId)).toEqual(["a", "b"]);
    expect(legend.fusionCards).toHaveLength(1);
    expect(legend).toMatchObject({ startingLp: 14000, energyBonus: 2, version: 3 });
  });

  it("aplana el efecto del nodo para editarlo campo a campo", () => {
    const node = mapAdminOlympusNode({
      id: "gennvim-identity-1", champion_id: "gennvim", branch: "IDENTITY",
      prerequisite_node_ids: ["gennvim-power-1"],
      effect_json: { kind: "SIGNATURE_CARD_LEVEL", amount: 5, cap: 30, cardIds: ["entity-claude"] },
      fragment_cost: 60, sort_order: 30, is_active: true, version: 1,
    });
    expect(node).toMatchObject({
      effectKind: "SIGNATURE_CARD_LEVEL", effectAmount: 5, effectCap: 30, effectCardIds: ["entity-claude"],
    });
  });

  it("ordena el árbol del campeón y aplica el LP por defecto", () => {
    const champion = mapAdminOlympusChampion(
      {
        id: "gennvim", arena_opponent_id: "training-tier-1", required_tier: 1, required_ladder_position: 1,
        base_deck_variant_id: "starter-tools", base_scale_json: { level: 14, versionTier: 2 },
        is_active: true, version: 2,
      },
      [
        { id: "b", sortOrder: 20 },
        { id: "a", sortOrder: 10 },
      ] as ReturnType<typeof mapAdminOlympusNode>[],
    );
    expect(champion.nodes.map((node) => node.id)).toEqual(["a", "b"]);
    expect(champion).toMatchObject({ baseLevel: 14, baseVersionTier: 2, baseStartingLp: 8000 });
  });
});
