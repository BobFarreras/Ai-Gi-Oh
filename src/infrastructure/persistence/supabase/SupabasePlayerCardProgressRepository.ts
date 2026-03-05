// src/infrastructure/persistence/supabase/SupabasePlayerCardProgressRepository.ts - Implementa repositorio de progresión por carta usando player_card_progress.
import { SupabaseClient } from "@supabase/supabase-js";
import { IPlayerCardProgress } from "@/core/entities/progression/IPlayerCardProgress";
import { ValidationError } from "@/core/errors/ValidationError";
import {
  IPlayerCardProgressRepository,
  IUpsertPlayerCardProgressInput,
} from "@/core/repositories/IPlayerCardProgressRepository";

interface IPlayerCardProgressRow {
  player_id: string;
  card_id: string;
  version_tier: number;
  level: number;
  xp: number;
  mastery_passive_skill_id: string | null;
  updated_at: string;
}

function toEntity(row: IPlayerCardProgressRow): IPlayerCardProgress {
  return {
    playerId: row.player_id,
    cardId: row.card_id,
    versionTier: row.version_tier,
    level: row.level,
    xp: row.xp,
    masteryPassiveSkillId: row.mastery_passive_skill_id,
    updatedAtIso: row.updated_at,
  };
}

export class SupabasePlayerCardProgressRepository implements IPlayerCardProgressRepository {
  constructor(private readonly client: SupabaseClient) {}

  async getByPlayerAndCard(playerId: string, cardId: string): Promise<IPlayerCardProgress | null> {
    const { data, error } = await this.client
      .from("player_card_progress")
      .select("player_id,card_id,version_tier,level,xp,mastery_passive_skill_id,updated_at")
      .eq("player_id", playerId)
      .eq("card_id", cardId)
      .maybeSingle<IPlayerCardProgressRow>();
    if (error) throw new ValidationError("No se pudo leer el progreso de la carta.");
    return data ? toEntity(data) : null;
  }

  async listByPlayer(playerId: string): Promise<IPlayerCardProgress[]> {
    const { data, error } = await this.client
      .from("player_card_progress")
      .select("player_id,card_id,version_tier,level,xp,mastery_passive_skill_id,updated_at")
      .eq("player_id", playerId);
    if (error) throw new ValidationError("No se pudo leer el progreso de cartas del jugador.");
    return ((data ?? []) as IPlayerCardProgressRow[]).map(toEntity);
  }

  async upsert(input: IUpsertPlayerCardProgressInput): Promise<IPlayerCardProgress> {
    const payload = {
      player_id: input.playerId,
      card_id: input.cardId,
      version_tier: input.versionTier ?? 0,
      level: input.level ?? 0,
      xp: input.xp ?? 0,
      mastery_passive_skill_id: input.masteryPassiveSkillId ?? null,
    };
    const { data, error } = await this.client
      .from("player_card_progress")
      .upsert(payload, { onConflict: "player_id,card_id" })
      .select("player_id,card_id,version_tier,level,xp,mastery_passive_skill_id,updated_at")
      .single<IPlayerCardProgressRow>();
    if (error || !data) throw new ValidationError("No se pudo guardar el progreso de la carta.");
    return toEntity(data);
  }
}
