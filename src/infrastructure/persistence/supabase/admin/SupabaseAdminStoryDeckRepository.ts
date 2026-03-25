// src/infrastructure/persistence/supabase/admin/SupabaseAdminStoryDeckRepository.ts - Implementa lectura y guardado de mazos Story para el panel admin.
import { SupabaseClient } from "@supabase/supabase-js";
import { ICard } from "@/core/entities/ICard";
import {
  IAdminStoryDeck,
  IAdminStoryDeckSummary,
  IAdminStoryDuelReference,
  IAdminStoryOpponentSummary,
} from "@/core/entities/admin/IAdminStoryDeck";
import { ValidationError } from "@/core/errors/ValidationError";
import { IAdminStoryDeckRepository } from "@/core/repositories/admin/IAdminStoryDeckRepository";
import { CARD_CATALOG_SELECT, ICardCatalogRow } from "@/infrastructure/persistence/supabase/internal/card-catalog-row";
import { loadCardsByIds } from "@/infrastructure/persistence/supabase/internal/load-cards-by-ids";
import { mapCardCatalogRowToCard } from "@/infrastructure/persistence/supabase/internal/map-card-catalog-row-to-card";

interface IStoryDeckCardRow { slot_index: number; card_id: string; copies: number }
interface IStoryDeckListRow { id: string; opponent_id: string; name: string; description: string | null; version: number; is_active: boolean }
interface IStoryOpponentRow { id: string; display_name: string; avatar_url: string | null; difficulty: IAdminStoryOpponentSummary["difficulty"] }
interface IStoryDuelRow { id: string; chapter: number; duel_index: number; title: string; deck_list_id: string }

function toDeckRows(cardIds: string[]): Array<{ slot_index: number; card_id: string; copies: number }> {
  const grouped = new Map<string, { slotIndex: number; copies: number }>();
  cardIds.forEach((cardId, index) => {
    const current = grouped.get(cardId);
    if (current) grouped.set(cardId, { slotIndex: current.slotIndex, copies: current.copies + 1 });
    else grouped.set(cardId, { slotIndex: index, copies: 1 });
  });
  return Array.from(grouped.entries())
    .map(([cardId, value]) => ({ slot_index: value.slotIndex, card_id: cardId, copies: value.copies }))
    .sort((left, right) => left.slot_index - right.slot_index)
    .map((row, index) => ({ ...row, slot_index: index }));
}

function buildOpponentSummaries(opponents: IStoryOpponentRow[], decks: IStoryDeckListRow[], duels: IStoryDuelRow[]): IAdminStoryOpponentSummary[] {
  return opponents.map((opponent) => {
    const opponentDeckIds = decks.filter((deck) => deck.opponent_id === opponent.id).map((deck) => deck.id);
    return {
      opponentId: opponent.id,
      displayName: opponent.display_name,
      avatarUrl: opponent.avatar_url,
      difficulty: opponent.difficulty,
      deckCount: opponentDeckIds.length,
      duelCount: duels.filter((duel) => opponentDeckIds.includes(duel.deck_list_id)).length,
    };
  });
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

  async getDeck(deckListId: string): Promise<IAdminStoryDeck | null> {
    const [deckResult, cardsResult] = await Promise.all([
      this.client.from("story_deck_lists").select("id,opponent_id,name,description,version,is_active").eq("id", deckListId).maybeSingle<IStoryDeckListRow>(),
      this.client.from("story_deck_list_cards").select("slot_index,card_id,copies").eq("deck_list_id", deckListId).order("slot_index", { ascending: true }),
    ]);
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

  async saveDeck(deckListId: string, cardIds: string[]): Promise<void> {
    const deleteResult = await this.client.from("story_deck_list_cards").delete().eq("deck_list_id", deckListId);
    if (deleteResult.error) throw new ValidationError(`No se pudo limpiar el deck Story previo. (${deleteResult.error.message})`);
    const payload = toDeckRows(cardIds).map((row) => ({ deck_list_id: deckListId, ...row }));
    const insertResult = await this.client.from("story_deck_list_cards").insert(payload);
    if (insertResult.error) throw new ValidationError(`No se pudo guardar el deck Story. (${insertResult.error.message})`);
  }

  async listAvailableCards(): Promise<ICard[]> {
    const { data, error } = await this.client.from("cards_catalog").select(CARD_CATALOG_SELECT).eq("is_active", true).order("name", { ascending: true });
    if (error) throw new ValidationError("No se pudo cargar catálogo de cartas activas.");
    return ((data ?? []) as ICardCatalogRow[]).map((row) => mapCardCatalogRowToCard(row));
  }
}

