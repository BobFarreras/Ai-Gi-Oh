// src/infrastructure/persistence/supabase/SupabaseArenaCatalogRepository.ts - Lee el catálogo de arena (tiers, oponentes, variantes y cartas) desde la BD.
import { SupabaseClient } from "@supabase/supabase-js";
import { IArenaDeckCardEntry, IArenaOpponent } from "@/core/entities/training/IArenaOpponent";
import { ITrainingTierDefinition } from "@/core/entities/training/ITrainingTierDefinition";
import { OpponentDifficulty } from "@/core/services/opponent/difficulty/types";

interface ITierRow { tier: number; code: string; required_wins_in_previous_tier: number; ai_difficulty: string; opponent_id: string; reward_multiplier: number }
interface IOpponentRow { id: string; code_name: string; display_name: string; avatar_url: string; intro_url: string; story_opponent_id: string }
interface IVariantRow { id: string; opponent_id: string; label: string | null }
interface ICardRow { variant_id: string; card_id: string; zone: "DECK" | "FUSION"; version_tier: number | null; level: number | null; xp: number | null }

export class SupabaseArenaCatalogRepository {
  constructor(private readonly client: SupabaseClient) {}

  /** Tiers activos ordenados; vacío si no hay datos (el caller cae al catálogo en código). */
  async listTiers(): Promise<ITrainingTierDefinition[]> {
    const { data, error } = await this.client
      .from("arena_tiers")
      .select("tier,code,required_wins_in_previous_tier,ai_difficulty,opponent_id,reward_multiplier")
      .eq("is_active", true)
      .order("tier", { ascending: true });
    if (error || !data) return [];
    return (data as ITierRow[]).map((row) => ({
      tier: row.tier,
      code: row.code,
      requiredWinsInPreviousTier: row.required_wins_in_previous_tier,
      aiDifficulty: row.ai_difficulty as OpponentDifficulty,
      deckTemplateId: row.opponent_id,
      rewardMultiplier: Number(row.reward_multiplier),
    }));
  }

  /** Mapa de oponentes con sus variantes y cartas; vacío si no hay datos (el caller cae a código). */
  async listOpponents(): Promise<Record<string, IArenaOpponent>> {
    const [opponentsRes, variantsRes, cardsRes] = await Promise.all([
      this.client.from("arena_opponents").select("id,code_name,display_name,avatar_url,intro_url,story_opponent_id").eq("is_active", true).order("sort_order", { ascending: true }),
      this.client.from("arena_opponent_deck_variants").select("id,opponent_id,label").eq("is_active", true).order("sort_order", { ascending: true }),
      this.client.from("arena_deck_variant_cards").select("variant_id,card_id,zone,version_tier,level,xp").order("sort_order", { ascending: true }),
    ]);
    if (opponentsRes.error || variantsRes.error || cardsRes.error || !opponentsRes.data) return {};

    const cardsByVariant = new Map<string, ICardRow[]>();
    for (const card of (cardsRes.data ?? []) as ICardRow[]) {
      const list = cardsByVariant.get(card.variant_id) ?? [];
      list.push(card);
      cardsByVariant.set(card.variant_id, list);
    }
    const toEntry = (row: ICardRow): IArenaDeckCardEntry => ({ cardId: row.card_id, versionTier: row.version_tier, level: row.level, xp: row.xp });

    const opponents: Record<string, IArenaOpponent> = {};
    for (const opponent of opponentsRes.data as IOpponentRow[]) {
      opponents[opponent.id] = {
        id: opponent.id,
        codeName: opponent.code_name,
        displayName: opponent.display_name,
        avatarUrl: opponent.avatar_url,
        introUrl: opponent.intro_url,
        storyOpponentId: opponent.story_opponent_id,
        variants: [],
      };
    }
    for (const variant of (variantsRes.data ?? []) as IVariantRow[]) {
      const owner = opponents[variant.opponent_id];
      if (!owner) continue;
      const variantCards = cardsByVariant.get(variant.id) ?? [];
      owner.variants.push({
        id: variant.id,
        label: variant.label,
        deckCards: variantCards.filter((card) => card.zone === "DECK").map(toEntry),
        fusionCards: variantCards.filter((card) => card.zone === "FUSION").map(toEntry),
      });
    }
    return opponents;
  }
}
