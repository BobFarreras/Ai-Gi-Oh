// src/infrastructure/persistence/supabase/SupabaseTrainingMatchClaimRepository.ts - Idempotencia de cierre de combates training mediante reserva única por batalla.
import { SupabaseClient } from "@supabase/supabase-js";
import { ValidationError } from "@/core/errors/ValidationError";
import { ITrainingMatchClaimRepository } from "@/core/repositories/ITrainingMatchClaimRepository";

interface IPostgrestErrorShape {
  code?: string;
}

export class SupabaseTrainingMatchClaimRepository implements ITrainingMatchClaimRepository {
  constructor(private readonly client: SupabaseClient) {}

  async tryReserveMatch(playerId: string, battleId: string, tier: number): Promise<boolean> {
    const { error } = await this.client.from("player_training_match_claims").insert({
      player_id: playerId,
      battle_id: battleId,
      tier,
    });
    if (!error) return true;
    if ((error as IPostgrestErrorShape).code === "23505") return false;
    throw new ValidationError("No se pudo reservar la partida de entrenamiento para idempotencia.");
  }
}
