// src/infrastructure/persistence/supabase/SupabasePlayerStoryDuelProgressRepository.ts - Persistencia del progreso Story por duelo con acumulado de victorias y derrotas.
import { SupabaseClient } from "@supabase/supabase-js";
import { ValidationError } from "@/core/errors/ValidationError";
import { IPlayerStoryDuelProgress } from "@/core/entities/story/IPlayerStoryDuelProgress";
import { IPlayerStoryDuelProgressRepository } from "@/core/repositories/IPlayerStoryDuelProgressRepository";

interface IStoryProgressRow {
  player_id: string;
  duel_id: string;
  wins: number;
  losses: number;
  best_result: "NOT_PLAYED" | "LOST" | "WON";
  first_cleared_at: string | null;
  last_played_at: string | null;
  updated_at: string;
}

function toEntity(row: IStoryProgressRow): IPlayerStoryDuelProgress {
  return {
    playerId: row.player_id,
    duelId: row.duel_id,
    wins: row.wins,
    losses: row.losses,
    bestResult: row.best_result,
    firstClearedAtIso: row.first_cleared_at,
    lastPlayedAtIso: row.last_played_at,
    updatedAtIso: row.updated_at,
  };
}

export class SupabasePlayerStoryDuelProgressRepository implements IPlayerStoryDuelProgressRepository {
  constructor(private readonly client: SupabaseClient) {}

  async listByPlayerId(playerId: string): Promise<IPlayerStoryDuelProgress[]> {
    const { data, error } = await this.client
      .from("player_story_duel_progress")
      .select("player_id,duel_id,wins,losses,best_result,first_cleared_at,last_played_at,updated_at")
      .eq("player_id", playerId);
    if (error) throw new ValidationError("No se pudo cargar el progreso Story del jugador.");
    return ((data ?? []) as IStoryProgressRow[]).map(toEntity);
  }

  async getByPlayerAndDuelId(playerId: string, duelId: string): Promise<IPlayerStoryDuelProgress | null> {
    const { data, error } = await this.client
      .from("player_story_duel_progress")
      .select("player_id,duel_id,wins,losses,best_result,first_cleared_at,last_played_at,updated_at")
      .eq("player_id", playerId)
      .eq("duel_id", duelId)
      .maybeSingle<IStoryProgressRow>();
    if (error) throw new ValidationError("No se pudo cargar el progreso del duelo Story.");
    return data ? toEntity(data) : null;
  }

  async registerDuelResult(playerId: string, duelId: string, didWin: boolean): Promise<IPlayerStoryDuelProgress> {
    const current = await this.getByPlayerAndDuelId(playerId, duelId);
    const nowIso = new Date().toISOString();
    const nextWins = (current?.wins ?? 0) + (didWin ? 1 : 0);
    const nextLosses = (current?.losses ?? 0) + (didWin ? 0 : 1);
    const nextBestResult = didWin ? "WON" : current?.bestResult === "WON" ? "WON" : "LOST";
    const firstClearedAt = didWin ? current?.firstClearedAtIso ?? nowIso : current?.firstClearedAtIso ?? null;
    const { data, error } = await this.client
      .from("player_story_duel_progress")
      .upsert(
        {
          player_id: playerId,
          duel_id: duelId,
          wins: nextWins,
          losses: nextLosses,
          best_result: nextBestResult,
          first_cleared_at: firstClearedAt,
          last_played_at: nowIso,
        },
        { onConflict: "player_id,duel_id" },
      )
      .select("player_id,duel_id,wins,losses,best_result,first_cleared_at,last_played_at,updated_at")
      .single<IStoryProgressRow>();
    if (error || !data) throw new ValidationError("No se pudo registrar el resultado del duelo Story.");
    return toEntity(data);
  }
}
