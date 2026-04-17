// src/infrastructure/persistence/supabase/SupabaseWalletRepository.ts - Implementa wallet Nexus persistida con operaciones atómicas básicas.
import { SupabaseClient } from "@supabase/supabase-js";
import { ValidationError } from "@/core/errors/ValidationError";
import { IPlayerWallet } from "@/core/entities/market/IPlayerWallet";
import { IWalletRepository } from "@/core/repositories/IWalletRepository";

interface IWalletRow {
  player_id: string;
  nexus: number;
}

interface IWalletMutationError {
  code?: string;
  message?: string;
}

function resolveWalletRpcRow(data: unknown): IWalletRow | null {
  if (Array.isArray(data)) {
    const first = data[0];
    if (!first || typeof first !== "object") return null;
    const row = first as Partial<IWalletRow>;
    if (typeof row.player_id !== "string" || typeof row.nexus !== "number") return null;
    return { player_id: row.player_id, nexus: row.nexus };
  }
  if (!data || typeof data !== "object") return null;
  const row = data as Partial<IWalletRow>;
  if (typeof row.player_id !== "string" || typeof row.nexus !== "number") return null;
  return { player_id: row.player_id, nexus: row.nexus };
}

function isMissingRpcError(error: IWalletMutationError | null): boolean {
  const normalizedMessage = error?.message?.toLowerCase() ?? "";
  return error?.code === "42883" || normalizedMessage.includes("function") || normalizedMessage.includes("rpc");
}

function isBusinessRuleRpcError(error: IWalletMutationError | null): boolean {
  return error?.code === "PGRST116" || error?.code === "22023" || error?.code === "P0001";
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
    const rpcResult = await this.client.rpc("wallet_debit_nexus", {
      p_player_id: playerId,
      p_amount: amount,
    });
    if (!rpcResult.error && rpcResult.data) {
      const row = resolveWalletRpcRow(rpcResult.data);
      if (row) return { playerId: row.player_id, nexus: row.nexus };
    }
    if (rpcResult.error && isBusinessRuleRpcError(rpcResult.error)) {
      if (rpcResult.error.code === "PGRST116" || rpcResult.error.code === "22023" || rpcResult.error.code === "P0001") {
        throw new ValidationError(rpcResult.error.message ?? "Saldo Nexus insuficiente para completar el débito.");
      }
    }
    if (rpcResult.error && !isMissingRpcError(rpcResult.error)) {
      const message = rpcResult.error.message?.toLowerCase() ?? "";
      if (message.includes("insuficiente") || message.includes("debito") || message.includes("débito")) {
        throw new ValidationError(rpcResult.error.message ?? "Saldo Nexus insuficiente para completar el débito.");
      }
      // Fallback legacy para entornos donde la RPC existe pero falla por grants/contexto.
    }

    // Fallback temporal para entornos donde la RPC atómica aún no fue desplegada
    // o no se puede ejecutar por permisos/contexto de sesión.
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
    const rpcResult = await this.client.rpc("wallet_credit_nexus", {
      p_player_id: playerId,
      p_amount: amount,
    });
    if (!rpcResult.error && rpcResult.data) {
      const row = resolveWalletRpcRow(rpcResult.data);
      if (row) return { playerId: row.player_id, nexus: row.nexus };
    }
    if (rpcResult.error && isBusinessRuleRpcError(rpcResult.error)) {
      if (rpcResult.error.code === "22023" || rpcResult.error.code === "P0001") {
        throw new ValidationError(rpcResult.error.message ?? "No se pudo acreditar Nexus.");
      }
    }
    if (rpcResult.error && !isMissingRpcError(rpcResult.error)) {
      const message = rpcResult.error.message?.toLowerCase() ?? "";
      if (message.includes("crédito") || message.includes("credito")) {
        throw new ValidationError(rpcResult.error.message ?? "No se pudo acreditar Nexus.");
      }
      // Fallback legacy para entornos donde la RPC existe pero falla por grants/contexto.
    }

    // Fallback temporal para entornos donde la RPC atómica aún no fue desplegada
    // o no se puede ejecutar por permisos/contexto de sesión.
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
