// src/infrastructure/persistence/supabase/SupabasePlayerProgressRepository.ts - Implementa repositorio de progreso de jugador usando tablas persistentes.
import { SupabaseClient } from "@supabase/supabase-js";
import { ValidationError } from "@/core/errors/ValidationError";
import { IPlayerProgress } from "@/core/entities/player/IPlayerProgress";
import { IPlayerProgressRepository, IUpdatePlayerProgressInput } from "@/core/repositories/IPlayerProgressRepository";

interface IPlayerProgressRow {
  player_id: string;
  has_completed_tutorial: boolean;
  medals: number;
  story_chapter: number;
  player_experience: number;
  updated_at: string;
}

function toEntity(row: IPlayerProgressRow): IPlayerProgress {
  return {
    playerId: row.player_id,
    hasCompletedTutorial: row.has_completed_tutorial,
    medals: row.medals,
    storyChapter: row.story_chapter,
    playerExperience: row.player_experience,
    updatedAtIso: row.updated_at,
  };
}

export class SupabasePlayerProgressRepository implements IPlayerProgressRepository {
  constructor(private readonly client: SupabaseClient) {}

  async getByPlayerId(playerId: string): Promise<IPlayerProgress | null> {
    const { data, error } = await this.client
      .from("player_progress")
      .select("player_id,has_completed_tutorial,medals,story_chapter,player_experience,updated_at")
      .eq("player_id", playerId)
      .maybeSingle<IPlayerProgressRow>();
    if (error) throw new ValidationError("No se pudo leer el progreso del jugador.");
    return data ? toEntity(data) : null;
  }

  async create(progress: IPlayerProgress): Promise<IPlayerProgress> {
    const { data, error } = await this.client
      .from("player_progress")
      .insert({
        player_id: progress.playerId,
        has_completed_tutorial: progress.hasCompletedTutorial,
        medals: progress.medals,
        story_chapter: progress.storyChapter,
        player_experience: progress.playerExperience,
      })
      .select("player_id,has_completed_tutorial,medals,story_chapter,player_experience,updated_at")
      .single<IPlayerProgressRow>();
    if (error) {
      // Puede existir una fila creada por trigger justo antes de esta inserción.
      if (error.code === "23505") {
        const existingProgress = await this.getByPlayerId(progress.playerId);
        if (existingProgress) return existingProgress;
      }
      throw new ValidationError("No se pudo crear el progreso del jugador.");
    }
    if (!data) throw new ValidationError("No se pudo crear el progreso del jugador.");
    return toEntity(data);
  }

  async update(input: IUpdatePlayerProgressInput): Promise<IPlayerProgress> {
    const updatePayload: { has_completed_tutorial?: boolean; medals?: number; story_chapter?: number; player_experience?: number } = {};
    if (input.hasCompletedTutorial !== undefined) updatePayload.has_completed_tutorial = input.hasCompletedTutorial;
    if (input.medals !== undefined) updatePayload.medals = input.medals;
    if (input.storyChapter !== undefined) updatePayload.story_chapter = input.storyChapter;
    if (input.playerExperience !== undefined) updatePayload.player_experience = input.playerExperience;
    const { data, error } = await this.client
      .from("player_progress")
      .update(updatePayload)
      .eq("player_id", input.playerId)
      .select("player_id,has_completed_tutorial,medals,story_chapter,player_experience,updated_at")
      .single<IPlayerProgressRow>();
    if (error || !data) throw new ValidationError("No se pudo actualizar el progreso del jugador.");
    return toEntity(data);
  }
}
