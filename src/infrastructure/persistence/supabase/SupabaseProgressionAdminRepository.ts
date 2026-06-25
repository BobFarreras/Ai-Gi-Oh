// src/infrastructure/persistence/supabase/SupabaseProgressionAdminRepository.ts - Lee/escribe definiciones de live-ops vía service_role (bypassa RLS; gate de admin en la capa de app).
import { SupabaseClient } from "@supabase/supabase-js";
import { MissionScope } from "@/core/entities/progression/IMission";
import { PromotionKind } from "@/core/entities/progression/IPromotion";
import { LoginRewardType } from "@/core/entities/progression/ILoginStreak";
import {
  IAdminEvent,
  IAdminEventRule,
  IAdminEventShopItem,
  IAdminLoginRewardDay,
  IAdminMissionDefinition,
  IAdminPromotionConfig,
  ILiveOpsAdminData,
} from "@/core/entities/progression/ILiveOpsAdmin";
import { IProgressionAdminRepository } from "@/core/repositories/progression/IProgressionAdminRepository";

export class SupabaseProgressionAdminRepository implements IProgressionAdminRepository {
  constructor(private readonly client: SupabaseClient) {}

  async getLiveOps(): Promise<ILiveOpsAdminData> {
    const [missions, promotions, events, rules, items, login] = await Promise.all([
      this.client.from("mission_definitions").select("*").order("sort_order", { ascending: true }),
      this.client.from("featured_promotions").select("*").order("sort_order", { ascending: true }),
      this.client.from("events").select("*").order("starts_at", { ascending: false }),
      this.client.from("event_point_rules").select("*"),
      this.client.from("event_shop_items").select("*").order("sort_order", { ascending: true }),
      this.client.from("login_reward_calendar").select("*").order("day_index", { ascending: true }),
    ]);

    const ruleRows = (rules.data as { event_id: string; action_type: string; points_per: number }[] | null) ?? [];
    const itemRows = (items.data as IEventShopItemRow[] | null) ?? [];
    const allMissions = ((missions.data as IMissionRow[] | null) ?? []).map(toMission);

    const adminEvents: IAdminEvent[] = ((events.data as IEventRow[] | null) ?? []).map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      currencyName: row.currency_name,
      startsAt: row.starts_at,
      endsAt: row.ends_at,
      isActive: row.is_active,
      rules: ruleRows.filter((rule) => rule.event_id === row.id).map((rule) => ({ eventId: rule.event_id, actionType: rule.action_type, pointsPer: rule.points_per })),
      items: itemRows.filter((item) => item.event_id === row.id).map(toShopItem),
      missions: allMissions.filter((mission) => mission.eventId === row.id),
    }));

    return {
      missions: allMissions,
      promotions: ((promotions.data as IPromotionRow[] | null) ?? []).map(toPromotion),
      events: adminEvents,
      loginCalendar: ((login.data as ILoginRow[] | null) ?? []).map((row) => ({
        dayIndex: row.day_index,
        rewardType: row.reward_type as LoginRewardType,
        rewardNexus: row.reward_nexus,
        rewardCardId: row.reward_card_id,
        label: row.label,
      })),
    };
  }

  async upsertMission(mission: IAdminMissionDefinition): Promise<void> {
    const { error } = await this.client.from("mission_definitions").upsert({
      id: mission.id, scope: mission.scope, objective_type: mission.objectiveType, objective_param: mission.objectiveParam,
      target_count: mission.targetCount, reward_nexus: mission.rewardNexus, reward_type: mission.rewardType, event_id: mission.eventId,
      title: mission.title, description: mission.description, sort_order: mission.sortOrder, is_active: mission.isActive,
    });
    if (error) throw new Error(`No se pudo guardar la misión: ${error.message}`);
  }

  async deleteMission(id: string): Promise<void> {
    const { error } = await this.client.from("mission_definitions").delete().eq("id", id);
    if (error) throw new Error(`No se pudo eliminar la misión: ${error.message}`);
  }

  async upsertPromotion(promotion: IAdminPromotionConfig): Promise<void> {
    const { error } = await this.client.from("featured_promotions").upsert({
      id: promotion.id, kind: promotion.kind, title: promotion.title, body: promotion.body, media_url: promotion.mediaUrl,
      cta_label: promotion.ctaLabel, cta_href: promotion.ctaHref, sort_order: promotion.sortOrder, is_active: promotion.isActive,
    });
    if (error) throw new Error(`No se pudo guardar la promoción: ${error.message}`);
  }

  async upsertEvent(event: Omit<IAdminEvent, "rules" | "items" | "missions">): Promise<void> {
    const { error } = await this.client.from("events").upsert({
      id: event.id, name: event.name, description: event.description, currency_name: event.currencyName,
      starts_at: event.startsAt, ends_at: event.endsAt, is_active: event.isActive,
    });
    if (error) throw new Error(`No se pudo guardar el evento: ${error.message}`);
  }

  async upsertEventRule(rule: IAdminEventRule): Promise<void> {
    const { error } = await this.client.from("event_point_rules").upsert({
      event_id: rule.eventId, action_type: rule.actionType, points_per: rule.pointsPer,
    });
    if (error) throw new Error(`No se pudo guardar la regla de puntos: ${error.message}`);
  }

  async upsertEventShopItem(item: IAdminEventShopItem): Promise<void> {
    const { error } = await this.client.from("event_shop_items").upsert({
      id: item.id, event_id: item.eventId, card_id: item.cardId, cost_points: item.costPoints,
      per_player_limit: item.perPlayerLimit, sort_order: item.sortOrder, is_active: item.isActive,
    });
    if (error) throw new Error(`No se pudo guardar el item de tienda: ${error.message}`);
  }

  async upsertLoginRewardDay(day: IAdminLoginRewardDay): Promise<void> {
    const { error } = await this.client.from("login_reward_calendar").upsert({
      day_index: day.dayIndex, reward_type: day.rewardType, reward_nexus: day.rewardNexus,
      reward_card_id: day.rewardCardId, label: day.label,
    });
    if (error) throw new Error(`No se pudo guardar el día de login: ${error.message}`);
  }
}

interface IMissionRow {
  id: string; scope: string; objective_type: string; objective_param: number | null; target_count: number; reward_nexus: number;
  reward_type: string; event_id: string | null; title: string; description: string | null; sort_order: number; is_active: boolean;
}
interface IPromotionRow {
  id: string; kind: string; title: string; body: string | null; media_url: string | null; cta_label: string | null; cta_href: string | null; sort_order: number; is_active: boolean;
}
interface IEventRow {
  id: string; name: string; description: string | null; currency_name: string; starts_at: string; ends_at: string; is_active: boolean;
}
interface IEventShopItemRow {
  id: string; event_id: string; card_id: string; cost_points: number; per_player_limit: number; sort_order: number; is_active: boolean;
}
interface ILoginRow {
  day_index: number; reward_type: string; reward_nexus: number; reward_card_id: string | null; label: string | null;
}

function toMission(row: IMissionRow): IAdminMissionDefinition {
  return {
    id: row.id, scope: row.scope as MissionScope, objectiveType: row.objective_type, objectiveParam: row.objective_param,
    targetCount: row.target_count, rewardNexus: row.reward_nexus,
    rewardType: row.reward_type === "EVENT_POINTS" ? "EVENT_POINTS" : "NEXUS", eventId: row.event_id,
    title: row.title, description: row.description, sortOrder: row.sort_order, isActive: row.is_active,
  };
}
function toPromotion(row: IPromotionRow): IAdminPromotionConfig {
  return {
    id: row.id, kind: row.kind as PromotionKind, title: row.title, body: row.body, mediaUrl: row.media_url,
    ctaLabel: row.cta_label, ctaHref: row.cta_href, sortOrder: row.sort_order, isActive: row.is_active,
  };
}
function toShopItem(row: IEventShopItemRow): IAdminEventShopItem {
  return {
    id: row.id, eventId: row.event_id, cardId: row.card_id, costPoints: row.cost_points,
    perPlayerLimit: row.per_player_limit, sortOrder: row.sort_order, isActive: row.is_active,
  };
}
