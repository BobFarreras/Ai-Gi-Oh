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

interface ICardMasteryPassiveMapRow {
  passive_skill_id: string;
}

interface ICardPassiveSkillRow {
  id: string;
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

  private async resolveDefaultMasteryPassiveSkillId(cardId: string): Promise<string | null> {
    const { data, error } = await this.client
      .from("card_mastery_passive_map")
      .select("passive_skill_id")
      .eq("card_id", cardId)
      .order("priority", { ascending: true })
      .limit(1)
      .maybeSingle<ICardMasteryPassiveMapRow>();
    if (error) throw new ValidationError("No se pudo resolver la pasiva de mastery para la carta.");
    if (data?.passive_skill_id) return data.passive_skill_id;
    const { data: fallbackData, error: fallbackError } = await this.client
      .from("card_passive_skills")
      .select("id")
      .eq("is_active", true)
      .order("id", { ascending: true })
      .limit(1)
      .maybeSingle<ICardPassiveSkillRow>();
    if (fallbackError) throw new ValidationError("No se pudo resolver la pasiva de mastery por defecto.");
    if (!fallbackData?.id) {
      throw new ValidationError("No hay pasivas activas para asignar la mastery de la carta en V5.");
    }
    return fallbackData.id;
  }

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
    const existing = await this.getByPlayerAndCard(input.playerId, input.cardId);
    const targetVersionTier = input.versionTier ?? existing?.versionTier ?? 0;
    const currentMasteryPassiveSkillId = input.masteryPassiveSkillId ?? existing?.masteryPassiveSkillId ?? null;
    const masteryPassiveSkillId =
      targetVersionTier >= 5 && !currentMasteryPassiveSkillId
        ? await this.resolveDefaultMasteryPassiveSkillId(input.cardId)
        : currentMasteryPassiveSkillId;
    const payload = {
      player_id: input.playerId,
      card_id: input.cardId,
      version_tier: targetVersionTier,
      level: input.level ?? existing?.level ?? 0,
      xp: input.xp ?? existing?.xp ?? 0,
      mastery_passive_skill_id: masteryPassiveSkillId,
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
