// src/infrastructure/persistence/supabase/SupabaseProgressionAdminRepository.ts - Lee/escribe definiciones de live-ops vía service_role (bypassa RLS; gate de admin en la capa de app).
import { SupabaseClient } from "@supabase/supabase-js";
import { MissionScope } from "@/core/entities/progression/IMission";
import { PromotionKind } from "@/core/entities/progression/IPromotion";
import { IAdminMissionDefinition, IAdminPromotionConfig, ILiveOpsAdminData } from "@/core/entities/progression/ILiveOpsAdmin";
import { IProgressionAdminRepository } from "@/core/repositories/progression/IProgressionAdminRepository";

interface IMissionRow {
  id: string;
  scope: string;
  objective_type: string;
  target_count: number;
  reward_nexus: number;
  title: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
}

interface IPromotionRow {
  id: string;
  kind: string;
  title: string;
  body: string | null;
  cta_label: string | null;
  cta_href: string | null;
  sort_order: number;
  is_active: boolean;
}

export class SupabaseProgressionAdminRepository implements IProgressionAdminRepository {
  constructor(private readonly client: SupabaseClient) {}

  async getLiveOps(): Promise<ILiveOpsAdminData> {
    const [missionsResult, promotionsResult] = await Promise.all([
      this.client.from("mission_definitions").select("*").order("sort_order", { ascending: true }),
      this.client.from("featured_promotions").select("*").order("sort_order", { ascending: true }),
    ]);
    const missions = ((missionsResult.data as IMissionRow[] | null) ?? []).map((row): IAdminMissionDefinition => ({
      id: row.id,
      scope: row.scope as MissionScope,
      objectiveType: row.objective_type,
      targetCount: row.target_count,
      rewardNexus: row.reward_nexus,
      title: row.title,
      description: row.description,
      sortOrder: row.sort_order,
      isActive: row.is_active,
    }));
    const promotions = ((promotionsResult.data as IPromotionRow[] | null) ?? []).map((row): IAdminPromotionConfig => ({
      id: row.id,
      kind: row.kind as PromotionKind,
      title: row.title,
      body: row.body,
      ctaLabel: row.cta_label,
      ctaHref: row.cta_href,
      sortOrder: row.sort_order,
      isActive: row.is_active,
    }));
    return { missions, promotions };
  }

  async upsertMission(mission: IAdminMissionDefinition): Promise<void> {
    const { error } = await this.client.from("mission_definitions").upsert({
      id: mission.id,
      scope: mission.scope,
      objective_type: mission.objectiveType,
      target_count: mission.targetCount,
      reward_nexus: mission.rewardNexus,
      title: mission.title,
      description: mission.description,
      sort_order: mission.sortOrder,
      is_active: mission.isActive,
    });
    if (error) throw new Error(`No se pudo guardar la misión: ${error.message}`);
  }

  async upsertPromotion(promotion: IAdminPromotionConfig): Promise<void> {
    const { error } = await this.client.from("featured_promotions").upsert({
      id: promotion.id,
      kind: promotion.kind,
      title: promotion.title,
      body: promotion.body,
      cta_label: promotion.ctaLabel,
      cta_href: promotion.ctaHref,
      sort_order: promotion.sortOrder,
      is_active: promotion.isActive,
    });
    if (error) throw new Error(`No se pudo guardar la promoción: ${error.message}`);
  }
}
