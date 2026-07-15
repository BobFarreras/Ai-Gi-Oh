// src/infrastructure/persistence/supabase/SupabasePlayerCardUpgradesRepository.ts - Lee los bonus de objetos de
// mejora (ATK/DEF) que un jugador ha aplicado a sus cartas. Solo LECTURA: la escritura la hacen las RPC
// security definer (apply_card_upgrade), nunca el cliente.
import { SupabaseClient } from "@supabase/supabase-js";
import { ICardUpgradeBonuses } from "@/core/services/progression/card-upgrade-rules";

interface IPlayerCardUpgradeRow {
  card_id: string;
  attack_bonus: number;
  defense_bonus: number;
}

export class SupabasePlayerCardUpgradesRepository {
  constructor(private readonly client: SupabaseClient) {}

  /** Bonus de objetos por carta para un jugador, indexado por cardId. Vacío si no tiene ninguno. */
  async getUpgradesByPlayer(playerId: string): Promise<Map<string, ICardUpgradeBonuses>> {
    const { data, error } = await this.client
      .from("player_card_upgrades")
      .select("card_id, attack_bonus, defense_bonus")
      .eq("player_id", playerId);
    // Un fallo de lectura no debe tumbar el flujo: sin bonus de objetos la carta usa sus stats base+nivel.
    if (error || !data) return new Map();
    return new Map(
      (data as IPlayerCardUpgradeRow[]).map((row) => [
        row.card_id,
        { attackBonus: row.attack_bonus, defenseBonus: row.defense_bonus },
      ]),
    );
  }
}
