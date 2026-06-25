// src/infrastructure/persistence/supabase/SupabasePromotionRepository.ts - Lee promociones activas (filtra por ventana temporal y orden), RLS de solo lectura.
import { SupabaseClient } from "@supabase/supabase-js";
import { IFeaturedPromotion, PromotionKind } from "@/core/entities/progression/IPromotion";
import { IPromotionRepository } from "@/core/repositories/progression/IPromotionRepository";

interface IPromotionRow {
  id: string;
  kind: string;
  title: string;
  body: string | null;
  media_url: string | null;
  cta_label: string | null;
  cta_href: string | null;
}

const VALID_KINDS: ReadonlySet<string> = new Set(["PACK", "CARD", "EVENT", "NEWS", "SYSTEM", "MAINTENANCE", "STORY"]);

function toPromotion(row: IPromotionRow): IFeaturedPromotion {
  return {
    id: row.id,
    kind: (VALID_KINDS.has(row.kind) ? row.kind : "NEWS") as PromotionKind,
    title: row.title,
    body: row.body,
    mediaUrl: row.media_url,
    ctaLabel: row.cta_label,
    ctaHref: row.cta_href,
  };
}

export class SupabasePromotionRepository implements IPromotionRepository {
  constructor(private readonly client: SupabaseClient) {}

  async getActive(): Promise<IFeaturedPromotion[]> {
    const nowIso = new Date().toISOString();
    const { data, error } = await this.client
      .from("featured_promotions")
      .select("id, kind, title, body, media_url, cta_label, cta_href")
      .eq("is_active", true)
      .lte("starts_at", nowIso)
      .or(`ends_at.is.null,ends_at.gte.${nowIso}`)
      .order("sort_order", { ascending: true });
    if (error || !data) return [];
    return (data as IPromotionRow[]).map(toPromotion);
  }
}
