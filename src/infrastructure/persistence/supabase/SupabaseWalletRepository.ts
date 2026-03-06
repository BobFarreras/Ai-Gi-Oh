// src/infrastructure/persistence/supabase/SupabaseWalletRepository.ts - Implementa wallet Nexus persistida con operaciones atómicas básicas.
import { SupabaseClient } from "@supabase/supabase-js";
import { ValidationError } from "@/core/errors/ValidationError";
import { IPlayerWallet } from "@/core/entities/market/IPlayerWallet";
import { IWalletRepository } from "@/core/repositories/IWalletRepository";

interface IWalletRow {
  player_id: string;
  nexus: number;
}

export class SupabaseWalletRepository implements IWalletRepository {
  constructor(private readonly client: SupabaseClient) {}

  async getWallet(playerId: string): Promise<IPlayerWallet> {
    const { data, error } = await this.client
      .from("player_wallets")
      .select("player_id,nexus")
      .eq("player_id", playerId)
      .maybeSingle<IWalletRow>();
    if (error) throw new ValidationError("No se pudo obtener el monedero del jugador.");
    if (!data) {
      const { data: insertedWallet, error: insertError } = await this.client
        .from("player_wallets")
        .insert({ player_id: playerId, nexus: 1000 })
        .select("player_id,nexus")
        .single<IWalletRow>();
      if (insertError || !insertedWallet) throw new ValidationError("No se pudo inicializar el monedero del jugador.");
      return { playerId: insertedWallet.player_id, nexus: insertedWallet.nexus };
    }
    return { playerId: data.player_id, nexus: data.nexus };
  }

  async debitNexus(playerId: string, amount: number): Promise<IPlayerWallet> {
    if (amount <= 0) throw new ValidationError("El débito Nexus debe ser positivo.");
    const current = await this.getWallet(playerId);
    if (current.nexus < amount) throw new ValidationError("Saldo Nexus insuficiente para completar el débito.");
    const { data, error } = await this.client
      .from("player_wallets")
      .update({ nexus: current.nexus - amount })
      .eq("player_id", playerId)
      .select("player_id,nexus")
      .single<IWalletRow>();
    if (error || !data) throw new ValidationError("No se pudo actualizar el monedero del jugador.");
    return { playerId: data.player_id, nexus: data.nexus };
  }

  async creditNexus(playerId: string, amount: number): Promise<IPlayerWallet> {
    if (amount <= 0) throw new ValidationError("El crédito Nexus debe ser positivo.");
    const current = await this.getWallet(playerId);
    const { data, error } = await this.client
      .from("player_wallets")
      .update({ nexus: current.nexus + amount })
      .eq("player_id", playerId)
      .select("player_id,nexus")
      .single<IWalletRow>();
    if (error || !data) throw new ValidationError("No se pudo actualizar el monedero del jugador.");
    return { playerId: data.player_id, nexus: data.nexus };
  }
}
