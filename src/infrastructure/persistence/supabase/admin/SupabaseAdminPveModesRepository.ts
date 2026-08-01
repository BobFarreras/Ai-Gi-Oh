// src/infrastructure/persistence/supabase/admin/SupabaseAdminPveModesRepository.ts - Lectura y escritura admin de Supervivencia y Olimpo (service-role).
import { SupabaseClient } from "@supabase/supabase-js";
import { ValidationError } from "@/core/errors/ValidationError";
import {
  IAdminPveModesSnapshot,
  IPublishOlympusSettingsCommand,
  IPublishSurvivalRulesetCommand,
  IUpsertOlympusChampionCommand,
  IUpsertOlympusLegendCommand,
  IUpsertOlympusNodeCommand,
} from "@/core/entities/admin/IAdminPveModes";
import { IAdminPveModesRepository } from "@/core/repositories/admin/IAdminPveModesRepository";
import {
  Row,
  mapAdminOlympusChampion,
  mapAdminOlympusLegend,
  mapAdminOlympusNode,
  mapAdminOlympusSettings,
  mapAdminSurvivalRuleset,
  mapAdminSurvivalStage,
} from "./internal/admin-pve-modes-mappers";

export class SupabaseAdminPveModesRepository implements IAdminPveModesRepository {
  constructor(private readonly client: SupabaseClient) {}

  async getSnapshot(): Promise<IAdminPveModesSnapshot> {
    const [rulesets, stages, settings, legends, deckEntries, champions, nodes, variants, opponents] = await Promise.all([
      this.client.from("survival_rulesets").select("*").order("version", { ascending: false }),
      this.client.from("survival_scaling_stages").select("*").order("from_battle"),
      this.client.from("olympus_settings").select("*").order("version", { ascending: false }),
      this.client.from("olympus_opponents").select("*").order("sort_order"),
      this.client.from("olympus_opponent_deck_entries").select("*").order("position"),
      this.client.from("olympus_champions").select("*").order("required_tier"),
      this.client.from("olympus_champion_upgrade_nodes").select("*").order("sort_order"),
      this.client.from("arena_opponent_deck_variants").select("id").order("id"),
      this.client.from("arena_opponents").select("id").order("id"),
    ]);
    const failed = [rulesets, stages, settings, legends, deckEntries, champions, nodes, variants, opponents]
      .some((result) => result.error);
    if (failed) throw new ValidationError("No se pudo leer la configuración de los modos PvE.");

    const stagesByRuleset = new Map<string, Row[]>();
    for (const stage of (stages.data ?? []) as Row[]) {
      const key = String(stage.ruleset_id);
      stagesByRuleset.set(key, [...(stagesByRuleset.get(key) ?? []), stage]);
    }
    const deckByLegend = new Map<string, Row[]>();
    for (const entry of (deckEntries.data ?? []) as Row[]) {
      const key = String(entry.opponent_id);
      deckByLegend.set(key, [...(deckByLegend.get(key) ?? []), entry]);
    }
    const mappedNodes = ((nodes.data ?? []) as Row[]).map(mapAdminOlympusNode);
    return {
      survivalRulesets: ((rulesets.data ?? []) as Row[]).map((row) => mapAdminSurvivalRuleset(
        row,
        (stagesByRuleset.get(String(row.id)) ?? []).map(mapAdminSurvivalStage),
      )),
      olympusSettings: ((settings.data ?? []) as Row[]).map(mapAdminOlympusSettings),
      legends: ((legends.data ?? []) as Row[]).map((row) => mapAdminOlympusLegend(row, deckByLegend.get(String(row.id)) ?? [])),
      champions: ((champions.data ?? []) as Row[]).map((row) => mapAdminOlympusChampion(
        row,
        mappedNodes.filter((node) => node.championId === String(row.id)),
      )),
      arenaDeckVariantIds: ((variants.data ?? []) as Row[]).map((row) => String(row.id)),
      arenaOpponentIds: ((opponents.data ?? []) as Row[]).map((row) => String(row.id)),
    };
  }

  async publishSurvivalRuleset(command: IPublishSurvivalRulesetCommand): Promise<number> {
    const { data, error } = await this.client.rpc("publish_survival_ruleset", {
      p_start_tier: command.startTier,
      p_battles_per_tier: command.battlesPerTier,
      p_roster: command.roster,
      p_milestone_interval: command.milestoneInterval,
      p_milestone_heal: command.milestoneHeal,
      p_stages: command.stages.map((stage) => ({
        fromBattle: stage.fromBattle,
        aiProfile: stage.aiProfile,
        cardScale: { maxTier: stage.maxTier },
        ascensionModifiers: { maxLpBonus: stage.maxLpBonus, statBonusPerRank: stage.statBonusPerRank },
        rewardDefinitionId: stage.rewardDefinitionId,
      })),
    });
    if (error || !data) throw new ValidationError("No se pudo publicar el ruleset de Supervivencia.");
    return Number((data as Row).version);
  }

  async publishOlympusSettings(command: IPublishOlympusSettingsCommand): Promise<number> {
    const { data, error } = await this.client.rpc("publish_olympus_settings", {
      p_daily_attempt_limit: command.dailyAttemptLimit,
      p_battle_ttl_minutes: command.battleTtlMinutes,
      p_respec_free_allowance: command.respecFreeAllowance,
      p_respec_cost: command.respecCost,
      p_respec_refund_percent: command.respecRefundPercent,
    });
    if (error || !data) throw new ValidationError("No se pudo publicar la configuración de Olimpo.");
    return Number((data as Row).version);
  }

  /** Editar identidad o deck sube la versión; las batallas en curso replican desde su snapshot inmutable. */
  async upsertLegend(command: IUpsertOlympusLegendCommand): Promise<void> {
    const current = await this.client.from("olympus_opponents").select("version").eq("id", command.id).maybeSingle();
    if (current.error) throw new ValidationError("No se pudo leer la leyenda.");
    const { error } = await this.client.from("olympus_opponents").upsert({
      id: command.id, code: command.code, display_name: command.displayName,
      deck_template_id: command.deckTemplateId, ai_profile: command.aiProfile,
      combat_modifiers_json: { startingLp: command.startingLp, energyBonus: command.energyBonus },
      reward_definition_id: command.rewardDefinitionId,
      avatar_path: command.avatarPath, intro_path: command.introPath,
      victory_path: command.victoryPath, defeat_path: command.defeatPath,
      lore: command.lore, special_rules_json: command.specialRules,
      base_fragment_reward: command.baseFragmentReward,
      first_victory_fragment_bonus: command.firstVictoryFragmentBonus,
      defeat_fragment_reward: command.defeatFragmentReward,
      available_from: command.availableFromIso, available_until: command.availableUntilIso,
      is_active: command.isActive, sort_order: command.sortOrder,
      version: Number(current.data?.version ?? 0) + 1,
    });
    if (error) throw new ValidationError("No se pudo guardar la leyenda de Olimpo.");
    await this.replaceLegendDeck(command);
  }

  private async replaceLegendDeck(command: IUpsertOlympusLegendCommand): Promise<void> {
    const removal = await this.client.from("olympus_opponent_deck_entries").delete().eq("opponent_id", command.id);
    if (removal.error) throw new ValidationError("No se pudo actualizar el deck legendario.");
    const toRow = (zone: "DECK" | "FUSION") => (entry: IUpsertOlympusLegendCommand["deckCards"][number], index: number) => ({
      opponent_id: command.id, zone, position: index + 1, card_id: entry.cardId,
      level: entry.level ?? 30, xp: entry.xp ?? 9800, version_tier: entry.versionTier ?? 5,
      attack_bonus: entry.attackBonus ?? 0, defense_bonus: entry.defenseBonus ?? 0,
    });
    const rows = [...command.deckCards.map(toRow("DECK")), ...command.fusionCards.map(toRow("FUSION"))];
    if (rows.length === 0) return;
    const insertion = await this.client.from("olympus_opponent_deck_entries").insert(rows);
    if (insertion.error) throw new ValidationError("No se pudieron guardar las cartas del deck legendario.");
  }

  async upsertChampion(command: IUpsertOlympusChampionCommand): Promise<void> {
    const current = await this.client.from("olympus_champions").select("version").eq("id", command.id).maybeSingle();
    if (current.error) throw new ValidationError("No se pudo leer el campeón.");
    const { error } = await this.client.from("olympus_champions").upsert({
      id: command.id, arena_opponent_id: command.arenaOpponentId,
      required_tier: command.requiredTier, required_ladder_position: command.requiredLadderPosition,
      base_deck_variant_id: command.baseDeckVariantId,
      base_scale_json: {
        level: command.baseLevel, versionTier: command.baseVersionTier, startingLp: command.baseStartingLp,
      },
      is_active: command.isActive, version: Number(current.data?.version ?? 0) + 1,
    });
    if (error) throw new ValidationError("No se pudo guardar el campeón de Olimpo.");
  }

  async upsertNode(command: IUpsertOlympusNodeCommand): Promise<void> {
    const current = await this.client.from("olympus_champion_upgrade_nodes").select("version").eq("id", command.id).maybeSingle();
    if (current.error) throw new ValidationError("No se pudo leer el nodo de mejora.");
    const effect: Record<string, unknown> = {
      kind: command.effectKind, amount: command.effectAmount, cap: command.effectCap,
    };
    if (command.effectCardIds.length > 0) effect.cardIds = command.effectCardIds;
    const { error } = await this.client.from("olympus_champion_upgrade_nodes").upsert({
      id: command.id, champion_id: command.championId, branch: command.branch,
      prerequisite_node_ids: command.prerequisiteNodeIds, effect_json: effect,
      fragment_cost: command.fragmentCost, sort_order: command.sortOrder,
      is_active: command.isActive, version: Number(current.data?.version ?? 0) + 1,
    });
    if (error) throw new ValidationError("No se pudo guardar el nodo de mejora.");
  }

  async deleteLegend(id: string): Promise<void> {
    const battles = await this.client.from("olympus_battles").select("battle_id").eq("opponent_id", id).limit(1);
    if (battles.error) throw new ValidationError("No se pudo comprobar el historial de la leyenda.");
    // Una leyenda con historial no se borra: se archiva, o perderíamos las batallas ya jugadas.
    if ((battles.data ?? []).length > 0) {
      const { error } = await this.client.from("olympus_opponents").update({ is_active: false }).eq("id", id);
      if (error) throw new ValidationError("No se pudo archivar la leyenda.");
      return;
    }
    const { error } = await this.client.from("olympus_opponents").delete().eq("id", id);
    if (error) throw new ValidationError("No se pudo eliminar la leyenda.");
  }

  async deleteNode(id: string): Promise<void> {
    const purchased = await this.client
      .from("player_olympus_champion_progress").select("player_id").contains("unlocked_node_ids", [id]).limit(1);
    if (purchased.error) throw new ValidationError("No se pudo comprobar quién compró el nodo.");
    // Borrar un nodo ya comprado dejaría su coste fuera del reembolso del respec: se archiva en su lugar.
    if ((purchased.data ?? []).length > 0) {
      const { error } = await this.client
        .from("olympus_champion_upgrade_nodes").update({ is_active: false }).eq("id", id);
      if (error) throw new ValidationError("No se pudo archivar el nodo de mejora.");
      return;
    }
    const { error } = await this.client.from("olympus_champion_upgrade_nodes").delete().eq("id", id);
    if (error) throw new ValidationError("No se pudo eliminar el nodo de mejora.");
  }
}
