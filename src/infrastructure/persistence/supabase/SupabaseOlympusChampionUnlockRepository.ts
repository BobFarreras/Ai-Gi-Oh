// src/infrastructure/persistence/supabase/SupabaseOlympusChampionUnlockRepository.ts - Concede campeones de Olimpo desde el cierre de Arena clásica.
import { SupabaseClient } from "@supabase/supabase-js";
import { ValidationError } from "@/core/errors/ValidationError";
import { IOlympusChampionUnlockRepository } from "@/core/repositories/IOlympusChampionUnlockRepository";

export class SupabaseOlympusChampionUnlockRepository implements IOlympusChampionUnlockRepository {
  constructor(
    private readonly readClient: SupabaseClient,
    private readonly writeClient: SupabaseClient,
  ) {}

  async listChampionIdsEarnedInTier(tier: number, tierWins: number): Promise<string[]> {
    if (tierWins <= 0) return [];
    const { data, error } = await this.readClient
      .from("olympus_champions")
      .select("id,required_ladder_position")
      .eq("is_active", true)
      .eq("required_tier", tier)
      .lte("required_ladder_position", tierWins);
    if (error) throw new ValidationError("No se pudo consultar el catálogo de campeones.");
    return (data ?? []).map((row) => String((row as { id: unknown }).id));
  }

  async grantUnlock(playerId: string, championId: string, tier: number, sourceBattleId: string): Promise<boolean> {
    const { data, error } = await this.writeClient.rpc("grant_champion_unlock_from_arena_win", {
      p_player_id: playerId,
      p_champion_id: championId,
      p_source_tier: tier,
      p_source_battle_id: sourceBattleId,
    });
    if (error) throw new ValidationError("No se pudo conceder el campeón de Olimpo.");
    return data === true;
  }
}
