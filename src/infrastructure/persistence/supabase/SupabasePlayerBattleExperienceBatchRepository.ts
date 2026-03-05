// src/infrastructure/persistence/supabase/SupabasePlayerBattleExperienceBatchRepository.ts - Implementa idempotencia de EXP por batalla en Supabase.
import { SupabaseClient } from "@supabase/supabase-js";
import { ValidationError } from "@/core/errors/ValidationError";
import { IPlayerBattleExperienceBatchRepository } from "@/core/repositories/IPlayerBattleExperienceBatchRepository";

interface IPostgrestErrorShape {
  code?: string;
}

export class SupabasePlayerBattleExperienceBatchRepository implements IPlayerBattleExperienceBatchRepository {
  constructor(private readonly client: SupabaseClient) {}

  async tryReserveBatch(playerId: string, battleId: string, eventsCount: number): Promise<boolean> {
    const { error } = await this.client.from("player_card_xp_batches").insert({
      player_id: playerId,
      battle_id: battleId,
      events_count: eventsCount,
    });
    if (!error) return true;
    const duplicateCode = (error as IPostgrestErrorShape).code;
    if (duplicateCode === "23505") return false;
    throw new ValidationError("No se pudo registrar la reserva de experiencia por batalla.");
  }
}

