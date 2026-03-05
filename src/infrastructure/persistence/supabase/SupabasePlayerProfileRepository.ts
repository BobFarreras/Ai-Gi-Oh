// src/infrastructure/persistence/supabase/SupabasePlayerProfileRepository.ts - Implementa repositorio de perfil de jugador con tablas reales en Supabase.
import { SupabaseClient } from "@supabase/supabase-js";
import { ValidationError } from "@/core/errors/ValidationError";
import { IPlayerProfile } from "@/core/entities/player/IPlayerProfile";
import { IPlayerProfileRepository, IUpdatePlayerProfileInput } from "@/core/repositories/IPlayerProfileRepository";

interface IPlayerProfileRow {
  player_id: string;
  nickname: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

function toEntity(row: IPlayerProfileRow): IPlayerProfile {
  return {
    playerId: row.player_id,
    nickname: row.nickname,
    avatarUrl: row.avatar_url,
    createdAtIso: row.created_at,
    updatedAtIso: row.updated_at,
  };
}

export class SupabasePlayerProfileRepository implements IPlayerProfileRepository {
  constructor(private readonly client: SupabaseClient) {}

  async getByPlayerId(playerId: string): Promise<IPlayerProfile | null> {
    const { data, error } = await this.client
      .from("player_profiles")
      .select("player_id,nickname,avatar_url,created_at,updated_at")
      .eq("player_id", playerId)
      .maybeSingle<IPlayerProfileRow>();
    if (error) throw new ValidationError("No se pudo leer el perfil del jugador.");
    return data ? toEntity(data) : null;
  }

  async create(profile: IPlayerProfile): Promise<IPlayerProfile> {
    const { data, error } = await this.client
      .from("player_profiles")
      .insert({
        player_id: profile.playerId,
        nickname: profile.nickname,
        avatar_url: profile.avatarUrl,
      })
      .select("player_id,nickname,avatar_url,created_at,updated_at")
      .single<IPlayerProfileRow>();
    if (error) {
      // En registros concurrentes el trigger puede crear la fila antes que esta inserción.
      if (error.code === "23505") {
        const existingProfile = await this.getByPlayerId(profile.playerId);
        if (existingProfile) return existingProfile;
      }
      throw new ValidationError("No se pudo crear el perfil del jugador.");
    }
    if (!data) throw new ValidationError("No se pudo crear el perfil del jugador.");
    return toEntity(data);
  }

  async update(input: IUpdatePlayerProfileInput): Promise<IPlayerProfile> {
    const updatePayload: { nickname?: string; avatar_url?: string | null } = {};
    if (input.nickname !== undefined) updatePayload.nickname = input.nickname;
    if (input.avatarUrl !== undefined) updatePayload.avatar_url = input.avatarUrl;
    const { data, error } = await this.client
      .from("player_profiles")
      .update(updatePayload)
      .eq("player_id", input.playerId)
      .select("player_id,nickname,avatar_url,created_at,updated_at")
      .single<IPlayerProfileRow>();
    if (error || !data) throw new ValidationError("No se pudo actualizar el perfil del jugador.");
    return toEntity(data);
  }
}
