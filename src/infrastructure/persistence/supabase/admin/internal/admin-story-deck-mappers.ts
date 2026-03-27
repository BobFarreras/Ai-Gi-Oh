// src/infrastructure/persistence/supabase/admin/internal/admin-story-deck-mappers.ts - Mapeadores y tipos de fila para repositorio admin de Story Decks.
import { IAdminStoryOpponentSummary } from "@/core/entities/admin/IAdminStoryDeck";
import { IAdminStoryDuelAiProfile, IAdminStoryDuelDeckOverride } from "@/core/entities/admin/IAdminStoryDuelConfig";
import { normalizeStoryAiProfile } from "@/core/services/opponent/difficulty/story-ai-profile";

export interface IStoryDeckCardRow { slot_index: number; card_id: string; copies: number }
export interface IStoryDeckListRow { id: string; opponent_id: string; name: string; description: string | null; version: number; is_active: boolean }
export interface IStoryOpponentRow { id: string; display_name: string; avatar_url: string | null; difficulty: IAdminStoryOpponentSummary["difficulty"] }
export interface IStoryDuelRow { id: string; chapter: number; duel_index: number; title: string; deck_list_id: string }
export interface IStoryDuelAiProfileRow { duel_id: string; difficulty: IAdminStoryDuelAiProfile["difficulty"]; ai_profile: Record<string, unknown> | null; is_active: boolean }
export interface IStoryDuelDeckOverrideRow {
  duel_id: string;
  slot_index: number;
  card_id: string;
  copies: number;
  version_tier: number;
  level: number;
  xp: number;
  attack_override: number | null;
  defense_override: number | null;
  effect_override: Record<string, unknown> | null;
  is_active: boolean;
}

export function toDeckRows(cardIds: string[]): Array<{ slot_index: number; card_id: string; copies: number }> {
  const grouped = new Map<string, { slotIndex: number; copies: number }>();
  cardIds.forEach((cardId, index) => {
    const current = grouped.get(cardId);
    if (current) grouped.set(cardId, { slotIndex: current.slotIndex, copies: current.copies + 1 });
    else grouped.set(cardId, { slotIndex: index, copies: 1 });
  });
  return Array.from(grouped.entries()).map(([cardId, value]) => ({ slot_index: value.slotIndex, card_id: cardId, copies: value.copies }))
    .sort((left, right) => left.slot_index - right.slot_index)
    .map((row, index) => ({ ...row, slot_index: index }));
}

export function buildOpponentSummaries(opponents: IStoryOpponentRow[], decks: IStoryDeckListRow[], duels: IStoryDuelRow[]): IAdminStoryOpponentSummary[] {
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

export function mapDuelAiProfileRow(row: IStoryDuelAiProfileRow): IAdminStoryDuelAiProfile {
  return { duelId: row.duel_id, difficulty: row.difficulty, aiProfile: normalizeStoryAiProfile(row.ai_profile, row.difficulty), isActive: row.is_active };
}

export function mapDuelDeckOverrideRow(row: IStoryDuelDeckOverrideRow): IAdminStoryDuelDeckOverride {
  return {
    duelId: row.duel_id,
    slotIndex: row.slot_index,
    cardId: row.card_id,
    copies: row.copies,
    versionTier: row.version_tier,
    level: row.level,
    xp: row.xp,
    attackOverride: row.attack_override,
    defenseOverride: row.defense_override,
    effectOverride: row.effect_override,
    isActive: row.is_active,
  };
}
