// src/infrastructure/persistence/supabase/SupabaseTrainingProgressRepository.ts - Persistencia del progreso de entrenamiento por jugador en Supabase.
import { SupabaseClient } from "@supabase/supabase-js";
import { ValidationError } from "@/core/errors/ValidationError";
import { ITrainingProgress, ITrainingTierStats } from "@/core/entities/training/ITrainingProgress";
import { ITrainingProgressRepository } from "@/core/repositories/ITrainingProgressRepository";

interface ITrainingProgressRow {
  player_id: string;
  highest_unlocked_tier: number;
  total_wins: number;
  total_matches: number;
  tier_stats: unknown;
  updated_at: string;
}

function mapTierStats(input: unknown): ITrainingTierStats[] {
  if (!Array.isArray(input)) return [];
  return input.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const raw = item as { tier?: unknown; wins?: unknown; matches?: unknown };
    if (typeof raw.tier !== "number" || typeof raw.wins !== "number" || typeof raw.matches !== "number") return [];
    return [{ tier: raw.tier, wins: raw.wins, matches: raw.matches }];
  });
}

function toEntity(row: ITrainingProgressRow): ITrainingProgress {
  return {
    playerId: row.player_id,
    highestUnlockedTier: row.highest_unlocked_tier,
    totalWins: row.total_wins,
    totalMatches: row.total_matches,
    tierStats: mapTierStats(row.tier_stats),
    updatedAtIso: row.updated_at,
  };
}

export class SupabaseTrainingProgressRepository implements ITrainingProgressRepository {
  constructor(private readonly client: SupabaseClient) {}

  async getByPlayerId(playerId: string): Promise<ITrainingProgress | null> {
    const { data, error } = await this.client
      .from("player_training_progress")
      .select("player_id,highest_unlocked_tier,total_wins,total_matches,tier_stats,updated_at")
      .eq("player_id", playerId)
      .maybeSingle<ITrainingProgressRow>();
    if (error) throw new ValidationError("No se pudo leer el progreso de entrenamiento.");
    return data ? toEntity(data) : null;
  }

  async upsert(progress: ITrainingProgress): Promise<ITrainingProgress> {
    const { data, error } = await this.client
      .from("player_training_progress")
      .upsert({
        player_id: progress.playerId,
        highest_unlocked_tier: progress.highestUnlockedTier,
        total_wins: progress.totalWins,
        total_matches: progress.totalMatches,
        tier_stats: progress.tierStats,
        updated_at: progress.updatedAtIso,
      })
      .select("player_id,highest_unlocked_tier,total_wins,total_matches,tier_stats,updated_at")
      .single<ITrainingProgressRow>();
    if (error || !data) throw new ValidationError("No se pudo guardar el progreso de entrenamiento.");
    return toEntity(data);
  }
}
