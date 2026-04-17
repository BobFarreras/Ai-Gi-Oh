// src/infrastructure/persistence/supabase/admin/SupabaseAdminStoryDeckRepository.ts - Implementa lectura y guardado de mazos Story para el panel admin.
import { SupabaseClient } from "@supabase/supabase-js";
import { ICard } from "@/core/entities/ICard";
import {
  IAdminStoryDeck,
  IAdminStoryDeckSummary,
  IAdminStoryDuelReference,
  IAdminStoryOpponentSummary,
} from "@/core/entities/admin/IAdminStoryDeck";
import {
  IAdminStoryDuelAiProfile,
  IAdminStoryDuelDeckOverride,
  IAdminStoryDuelFusionCard,
  IAdminStoryDuelRewardCard,
} from "@/core/entities/admin/IAdminStoryDuelConfig";
import { IAdminSaveStoryDuelConfigCommand } from "@/core/entities/admin/IAdminStoryDeckCommands";
import { ValidationError } from "@/core/errors/ValidationError";
import { IAdminStoryDeckRepository } from "@/core/repositories/admin/IAdminStoryDeckRepository";
import {
  buildOpponentSummaries,
  IStoryDeckCardRow,
  IStoryDeckListRow,
  IStoryDuelAiProfileRow,
  IStoryDuelDeckOverrideRow,
  IStoryDuelFusionCardRow,
  IStoryDuelRewardCardRow,
  IStoryDuelRow,
  IStoryOpponentRow,
  mapDuelAiProfileRow,
  mapDuelDeckOverrideRow,
  mapDuelFusionCardRow,
  mapDuelRewardCardRow,
  toDeckRows,
} from "@/infrastructure/persistence/supabase/admin/internal/admin-story-deck-mappers";
import { CARD_CATALOG_SELECT, ICardCatalogRow } from "@/infrastructure/persistence/supabase/internal/card-catalog-row";
import { loadCardsByIds } from "@/infrastructure/persistence/supabase/internal/load-cards-by-ids";
import { mapCardCatalogRowToCard } from "@/infrastructure/persistence/supabase/internal/map-card-catalog-row-to-card";
import { saveStoryDuelConfig } from "@/infrastructure/persistence/supabase/admin/internal/admin-story-deck-save-duel-config";
function isMissingFusionTableError(error: { message?: string; code?: string } | null): boolean {
  if (!error) return false;
  return error.code === "PGRST205" || (error.message ?? "").includes("story_duel_fusion_cards") && (error.message ?? "").includes("schema cache");
}

function isMissingFusionTableError(error: { message?: string; code?: string } | null): boolean {
  if (!error) return false;
  const message = error.message ?? "";
  return error.code === "PGRST205" || message.includes("story_duel_fusion_cards") && message.includes("schema cache");
}

export class SupabaseAdminStoryDeckRepository implements IAdminStoryDeckRepository {
  constructor(private readonly client: SupabaseClient) {}

  async listOpponents(): Promise<IAdminStoryOpponentSummary[]> {
    const [opponentsResult, decksResult, duelsResult] = await Promise.all([
      this.client.from("story_opponents").select("id,display_name,avatar_url,difficulty").eq("is_active", true).order("display_name", { ascending: true }),
      this.client.from("story_deck_lists").select("id,opponent_id,name,description,version,is_active"),
      this.client.from("story_duels").select("id,chapter,duel_index,title,deck_list_id").eq("is_active", true),
    ]);
    if (opponentsResult.error || decksResult.error || duelsResult.error) throw new ValidationError("No se pudo cargar catálogo de oponentes Story.");
    return buildOpponentSummaries((opponentsResult.data ?? []) as IStoryOpponentRow[], (decksResult.data ?? []) as IStoryDeckListRow[], (duelsResult.data ?? []) as IStoryDuelRow[]);
  }

  async listDeckSummaries(): Promise<IAdminStoryDeckSummary[]> {
    const { data, error } = await this.client.from("story_deck_lists").select("id,opponent_id,name,description,version,is_active").order("name", { ascending: true });
    if (error) throw new ValidationError("No se pudo cargar listado de decks Story.");
    return ((data ?? []) as IStoryDeckListRow[]).map((row) => ({ deckListId: row.id, opponentId: row.opponent_id, name: row.name, version: row.version, isActive: row.is_active }));
  }

  async listDuelReferences(): Promise<IAdminStoryDuelReference[]> {
    const { data, error } = await this.client.from("story_duels").select("id,chapter,duel_index,title,deck_list_id").eq("is_active", true).order("chapter", { ascending: true }).order("duel_index", { ascending: true });
    if (error) throw new ValidationError("No se pudo cargar referencias de duelos Story.");
    return ((data ?? []) as IStoryDuelRow[]).map((row) => ({ duelId: row.id, chapter: row.chapter, duelIndex: row.duel_index, title: row.title, deckListId: row.deck_list_id }));
  }

  async listDuelAiProfiles(duelIds: string[]): Promise<IAdminStoryDuelAiProfile[]> {
    if (duelIds.length === 0) return [];
    const { data, error } = await this.client.from("story_duel_ai_profiles").select("duel_id,difficulty,ai_profile,is_active").in("duel_id", duelIds);
    if (error) throw new ValidationError("No se pudieron cargar perfiles IA de duelos Story.");
    return ((data ?? []) as IStoryDuelAiProfileRow[]).map(mapDuelAiProfileRow);
  }

  async listDuelDeckOverrides(duelIds: string[]): Promise<IAdminStoryDuelDeckOverride[]> {
    if (duelIds.length === 0) return [];
    const { data, error } = await this.client
      .from("story_duel_deck_overrides")
      .select("duel_id,slot_index,card_id,copies,version_tier,level,xp,attack_override,defense_override,effect_override,is_active")
      .in("duel_id", duelIds)
      .order("duel_id", { ascending: true })
      .order("slot_index", { ascending: true });
    if (error) throw new ValidationError("No se pudieron cargar overrides de mazo por duelo.");
    return ((data ?? []) as IStoryDuelDeckOverrideRow[]).map(mapDuelDeckOverrideRow);
  }

  async listDuelFusionCards(duelIds: string[]): Promise<IAdminStoryDuelFusionCard[]> {
    if (duelIds.length === 0) return [];
    const { data, error } = await this.client
      .from("story_duel_fusion_cards")
      .select("duel_id,slot_index,card_id,is_active")
      .in("duel_id", duelIds)
      .order("duel_id", { ascending: true })
      .order("slot_index", { ascending: true });
    if (error) {
      if (isMissingFusionTableError(error)) return [];
      throw new ValidationError(`No se pudieron cargar cartas de fusión por duelo. (${error.message})`);
    }
    return ((data ?? []) as IStoryDuelFusionCardRow[]).map(mapDuelFusionCardRow);
  }

  async listDuelRewardCards(duelIds: string[]): Promise<IAdminStoryDuelRewardCard[]> {
    if (duelIds.length === 0) return [];
    const { data, error } = await this.client
      .from("story_duel_reward_cards")
      .select("duel_id,card_id,copies,drop_rate,is_guaranteed")
      .in("duel_id", duelIds)
      .order("duel_id", { ascending: true })
      .order("card_id", { ascending: true });
    if (error) throw new ValidationError("No se pudieron cargar cartas de recompensa por duelo.");
    return ((data ?? []) as IStoryDuelRewardCardRow[]).map(mapDuelRewardCardRow);
  }

  async getDeck(deckListId: string): Promise<IAdminStoryDeck | null> {
    const [deckResult, cardsResult] = await Promise.all([this.client.from("story_deck_lists").select("id,opponent_id,name,description,version,is_active").eq("id", deckListId).maybeSingle<IStoryDeckListRow>(), this.client.from("story_deck_list_cards").select("slot_index,card_id,copies").eq("deck_list_id", deckListId).order("slot_index", { ascending: true })]);
    if (deckResult.error || cardsResult.error) throw new ValidationError("No se pudo cargar el deck Story solicitado.");
    if (!deckResult.data) return null;
    const rows = (cardsResult.data ?? []) as IStoryDeckCardRow[];
    const expandedCardIds = rows.flatMap((row) => Array.from({ length: row.copies }, () => row.card_id));
    const cardsById = await loadCardsByIds(this.client, expandedCardIds);
    return {
      deckListId: deckResult.data.id,
      opponentId: deckResult.data.opponent_id,
      name: deckResult.data.name,
      description: deckResult.data.description,
      version: deckResult.data.version,
      isActive: deckResult.data.is_active,
      slots: expandedCardIds.map((cardId, slotIndex) => ({ slotIndex, cardId, card: cardsById.get(cardId) ?? null })),
    };
  }

  async saveDeck(deckListId: string, cardIds: string[], duelConfig: IAdminSaveStoryDuelConfigCommand | null, updateBaseDeck: boolean): Promise<void> {
    if (updateBaseDeck) {
      const deleteResult = await this.client.from("story_deck_list_cards").delete().eq("deck_list_id", deckListId);
      if (deleteResult.error) throw new ValidationError(`No se pudo limpiar el deck Story previo. (${deleteResult.error.message})`);
      const payload = toDeckRows(cardIds).map((row) => ({ deck_list_id: deckListId, ...row }));
      const insertResult = await this.client.from("story_deck_list_cards").insert(payload);
      if (insertResult.error) throw new ValidationError(`No se pudo guardar el deck Story. (${insertResult.error.message})`);
    }
    if (duelConfig) await saveStoryDuelConfig(this.client, deckListId, duelConfig);
  }

  async listAvailableCards(): Promise<ICard[]> {
    const { data, error } = await this.client.from("cards_catalog").select(CARD_CATALOG_SELECT).eq("is_active", true).order("name", { ascending: true });
    if (error) throw new ValidationError("No se pudo cargar catálogo de cartas activas.");
    return ((data ?? []) as ICardCatalogRow[]).map((row) => mapCardCatalogRowToCard(row));
  }
}

