// src/infrastructure/persistence/supabase/internal/story-opponent-repository-queries.ts - Consultas SQL agrupadas para repositorio de oponentes Story.
import { SupabaseClient } from "@supabase/supabase-js";
import { ValidationError } from "@/core/errors/ValidationError";
import { IStoryDuelRow } from "./story-opponent-repository-types";

const STORY_DUEL_SELECT =
  "id,chapter,duel_index,title,description,opponent_id,deck_list_id,opening_hand_size,starter_player,reward_nexus,reward_player_experience,unlock_requirement_duel_id,is_boss_duel,is_active";

/**
 * Intenta cargar un duelo por chapter/duel_index y luego por id canónico como fallback.
 */
export async function fetchStoryDuelRow(
  client: SupabaseClient,
  chapter: number,
  duelIndex: number,
): Promise<IStoryDuelRow | null> {
  const duelResult = await client
    .from("story_duels")
    .select(STORY_DUEL_SELECT)
    .eq("chapter", chapter)
    .eq("duel_index", duelIndex)
    .eq("is_active", true)
    .maybeSingle<IStoryDuelRow>();
  if (duelResult.error) throw new ValidationError("No se pudo cargar el duelo de historia.");
  if (duelResult.data) return duelResult.data;
  const fallbackDuelId = `story-ch${chapter}-duel-${duelIndex}`;
  const fallbackResult = await client
    .from("story_duels")
    .select(STORY_DUEL_SELECT)
    .eq("id", fallbackDuelId)
    .eq("is_active", true)
    .maybeSingle<IStoryDuelRow>();
  if (fallbackResult.error) throw new ValidationError("No se pudo cargar el duelo de historia por id canónico.");
  return fallbackResult.data;
}
