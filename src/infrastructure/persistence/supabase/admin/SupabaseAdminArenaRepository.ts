// src/infrastructure/persistence/supabase/admin/SupabaseAdminArenaRepository.ts - Lectura completa y escritura del catálogo de arena para el panel admin (service-role).
import { SupabaseClient } from "@supabase/supabase-js";
import { ValidationError } from "@/core/errors/ValidationError";
import {
  IAdminArenaCardEntry,
  IAdminArenaOpponent,
  IAdminArenaTier,
  IUpsertArenaOpponentCommand,
  IUpsertArenaTierCommand,
  IUpsertArenaVariantCommand,
} from "@/core/entities/training/IAdminArena";

interface IOpponentRow { id: string; code_name: string; display_name: string; avatar_url: string; intro_url: string; story_opponent_id: string; is_active: boolean; sort_order: number }
interface IVariantRow { id: string; opponent_id: string; label: string | null; sort_order: number; is_active: boolean }
interface ICardRow { variant_id: string; card_id: string; zone: "DECK" | "FUSION"; version_tier: number | null; level: number | null; xp: number | null }
interface ITierRow { tier: number; code: string; required_wins_in_previous_tier: number; ai_difficulty: string; opponent_id: string; reward_multiplier: number; is_active: boolean; default_version_tier: number | null; default_level: number | null; default_xp: number | null }

export class SupabaseAdminArenaRepository {
  constructor(private readonly client: SupabaseClient) {}

  async getOpponents(): Promise<IAdminArenaOpponent[]> {
    const [opponentsRes, variantsRes, cardsRes] = await Promise.all([
      this.client.from("arena_opponents").select("id,code_name,display_name,avatar_url,intro_url,story_opponent_id,is_active,sort_order").order("sort_order"),
      this.client.from("arena_opponent_deck_variants").select("id,opponent_id,label,sort_order,is_active").order("sort_order"),
      this.client.from("arena_deck_variant_cards").select("variant_id,card_id,zone,version_tier,level,xp").order("sort_order"),
    ]);
    if (opponentsRes.error || variantsRes.error || cardsRes.error) throw new ValidationError("No se pudo leer el catálogo de arena.");
    const cardsByVariant = new Map<string, ICardRow[]>();
    for (const card of (cardsRes.data ?? []) as ICardRow[]) {
      const list = cardsByVariant.get(card.variant_id) ?? [];
      list.push(card);
      cardsByVariant.set(card.variant_id, list);
    }
    const toEntry = (row: ICardRow): IAdminArenaCardEntry => ({ cardId: row.card_id, versionTier: row.version_tier, level: row.level, xp: row.xp });
    const opponents = (opponentsRes.data as IOpponentRow[]).map((row) => ({
      id: row.id, codeName: row.code_name, displayName: row.display_name, avatarUrl: row.avatar_url,
      introUrl: row.intro_url, storyOpponentId: row.story_opponent_id, isActive: row.is_active, sortOrder: row.sort_order, variants: [],
    })) as IAdminArenaOpponent[];
    const byId = new Map(opponents.map((opponent) => [opponent.id, opponent]));
    for (const variant of (variantsRes.data ?? []) as IVariantRow[]) {
      const owner = byId.get(variant.opponent_id);
      if (!owner) continue;
      const cards = cardsByVariant.get(variant.id) ?? [];
      owner.variants.push({
        id: variant.id, opponentId: variant.opponent_id, label: variant.label, sortOrder: variant.sort_order, isActive: variant.is_active,
        deckCards: cards.filter((c) => c.zone === "DECK").map(toEntry),
        fusionCards: cards.filter((c) => c.zone === "FUSION").map(toEntry),
      });
    }
    return opponents;
  }

  async getTiers(): Promise<IAdminArenaTier[]> {
    const { data, error } = await this.client.from("arena_tiers").select("tier,code,required_wins_in_previous_tier,ai_difficulty,opponent_id,reward_multiplier,is_active,default_version_tier,default_level,default_xp").order("tier");
    if (error) throw new ValidationError("No se pudieron leer los tiers de arena.");
    return (data as ITierRow[]).map((row) => ({
      tier: row.tier, code: row.code, requiredWinsInPreviousTier: row.required_wins_in_previous_tier,
      aiDifficulty: row.ai_difficulty, opponentId: row.opponent_id, rewardMultiplier: Number(row.reward_multiplier), isActive: row.is_active,
      defaultVersionTier: row.default_version_tier, defaultLevel: row.default_level, defaultXp: row.default_xp,
    }));
  }

  async upsertOpponent(command: IUpsertArenaOpponentCommand): Promise<void> {
    const { error } = await this.client.from("arena_opponents").upsert({
      id: command.id, code_name: command.codeName, display_name: command.displayName, avatar_url: command.avatarUrl,
      intro_url: command.introUrl, story_opponent_id: command.storyOpponentId, is_active: command.isActive, sort_order: command.sortOrder, updated_at: new Date().toISOString(),
    });
    if (error) throw new ValidationError("No se pudo guardar el oponente de arena.");
  }

  async upsertVariant(command: IUpsertArenaVariantCommand): Promise<void> {
    const variant = await this.client.from("arena_opponent_deck_variants").upsert({
      id: command.id, opponent_id: command.opponentId, label: command.label, sort_order: command.sortOrder, is_active: command.isActive, updated_at: new Date().toISOString(),
    });
    if (variant.error) throw new ValidationError("No se pudo guardar la variante de mazo.");
    const removal = await this.client.from("arena_deck_variant_cards").delete().eq("variant_id", command.id);
    if (removal.error) throw new ValidationError("No se pudo actualizar las cartas de la variante.");
    const rows = [
      ...command.deckCards.map((card, index) => ({ variant_id: command.id, card_id: card.cardId, zone: "DECK", version_tier: card.versionTier, level: card.level, xp: card.xp, sort_order: index + 1 })),
      ...command.fusionCards.map((card, index) => ({ variant_id: command.id, card_id: card.cardId, zone: "FUSION", version_tier: card.versionTier, level: card.level, xp: card.xp, sort_order: index + 1 })),
    ];
    if (rows.length > 0) {
      const insertion = await this.client.from("arena_deck_variant_cards").insert(rows);
      if (insertion.error) throw new ValidationError("No se pudieron guardar las cartas de la variante.");
    }
  }

  async upsertTier(command: IUpsertArenaTierCommand): Promise<void> {
    const { error } = await this.client.from("arena_tiers").upsert({
      tier: command.tier, code: command.code, required_wins_in_previous_tier: command.requiredWinsInPreviousTier,
      ai_difficulty: command.aiDifficulty, opponent_id: command.opponentId, reward_multiplier: command.rewardMultiplier, is_active: command.isActive,
      default_version_tier: command.defaultVersionTier, default_level: command.defaultLevel, default_xp: command.defaultXp, updated_at: new Date().toISOString(),
    });
    if (error) throw new ValidationError("No se pudo guardar el tier de arena.");
  }

  async deleteOpponent(id: string): Promise<void> {
    const { error } = await this.client.from("arena_opponents").delete().eq("id", id);
    if (error) throw new ValidationError("No se pudo eliminar el oponente de arena.");
  }

  async deleteVariant(id: string): Promise<void> {
    const { error } = await this.client.from("arena_opponent_deck_variants").delete().eq("id", id);
    if (error) throw new ValidationError("No se pudo eliminar la variante de mazo.");
  }

  async deleteTier(tier: number): Promise<void> {
    const { error } = await this.client.from("arena_tiers").delete().eq("tier", tier);
    if (error) throw new ValidationError("No se pudo eliminar el tier de arena.");
  }
}
