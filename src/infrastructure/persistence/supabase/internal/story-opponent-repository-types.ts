// src/infrastructure/persistence/supabase/internal/story-opponent-repository-types.ts - Tipos de filas y mapeadores para repositorio de oponentes Story.
import {
  IStoryDeckEntryDefinition,
  IStoryRewardCardDefinition,
  StoryOpponentDifficulty,
} from "@/core/entities/opponent/IStoryDuelDefinition";

export interface IStoryDuelRow {
  id: string;
  chapter: number;
  duel_index: number;
  title: string;
  description: string;
  opponent_id: string;
  deck_list_id: string;
  opening_hand_size: number;
  starter_player: "PLAYER" | "OPPONENT" | "RANDOM";
  reward_nexus: number;
  reward_player_experience: number;
  unlock_requirement_duel_id: string | null;
  is_boss_duel: boolean;
  is_active: boolean;
}

export interface IStoryOpponentRow {
  id: string;
  display_name: string;
  avatar_url: string | null;
  difficulty: StoryOpponentDifficulty;
}

export interface IStoryDeckCardRow {
  card_id: string;
  copies: number;
  slot_index: number;
}

export interface IStoryRewardCardRow {
  card_id: string;
  copies: number;
  drop_rate: number;
  is_guaranteed: boolean;
}

export interface IStoryDuelAiProfileRow {
  duel_id?: string;
  difficulty: StoryOpponentDifficulty;
  ai_profile: Record<string, unknown> | null;
}

export interface IStoryDuelFusionCardRow {
  slot_index: number;
  card_id: string;
}

export interface IStoryDeckOverrideRow {
  slot_index: number;
  card_id: string;
  copies: number;
  version_tier: number;
  level: number;
  xp: number;
  attack_override: number | null;
  defense_override: number | null;
  effect_override: Record<string, unknown> | null;
}

export function isMissingFusionTableError(error: { message?: string; code?: string } | null): boolean {
  if (!error) return false;
  const message = error.message ?? "";
  return error.code === "PGRST205" || message.includes("story_duel_fusion_cards") && message.includes("schema cache");
}

export function resolveCanonicalStoryDuelIdentity(input: { id: string; chapter: number; duelIndex: number }): {
  chapter: number;
  duelIndex: number;
} {
  const match = /^story-ch(\d+)-duel-(\d+)$/i.exec(input.id);
  if (!match) return { chapter: input.chapter, duelIndex: input.duelIndex };
  const chapter = Number.parseInt(match[1] ?? "", 10);
  const duelIndex = Number.parseInt(match[2] ?? "", 10);
  if (!Number.isFinite(chapter) || !Number.isFinite(duelIndex)) return { chapter: input.chapter, duelIndex: input.duelIndex };
  return { chapter, duelIndex };
}

export function toRewardCards(rows: IStoryRewardCardRow[]): IStoryRewardCardDefinition[] {
  return rows.map((row) => ({ cardId: row.card_id, copies: row.copies, dropRate: row.drop_rate, isGuaranteed: row.is_guaranteed }));
}

export function toDeckEntries(rows: IStoryDeckCardRow[]): IStoryDeckEntryDefinition[] {
  return rows.flatMap((row) =>
    Array.from({ length: row.copies }, () => ({ cardId: row.card_id, versionTier: 0, level: 0, xp: 0, attackOverride: null, defenseOverride: null, effectOverride: null })),
  );
}

export function toDeckEntriesFromOverrides(rows: IStoryDeckOverrideRow[]): IStoryDeckEntryDefinition[] {
  return rows.flatMap((row) =>
    Array.from({ length: row.copies }, () => ({
      cardId: row.card_id,
      versionTier: row.version_tier,
      level: row.level,
      xp: row.xp,
      attackOverride: row.attack_override,
      defenseOverride: row.defense_override,
      effectOverride: row.effect_override ?? null,
    })),
  );
}
