// src/infrastructure/persistence/supabase/SupabaseTransactionRepository.ts - Repositorio de historial de transacciones de mercado persistido en Supabase.
import { SupabaseClient } from "@supabase/supabase-js";
import { ValidationError } from "@/core/errors/ValidationError";
import { IMarketTransaction } from "@/core/entities/market/IMarketTransaction";
import { ITransactionRepository } from "@/core/repositories/ITransactionRepository";

interface ITransactionRow {
  id: string;
  player_id: string;
  transaction_type: IMarketTransaction["transactionType"];
  amount_nexus: number;
  purchased_item_id: string;
  purchased_card_ids: string[];
  created_at: string;
}

function toEntity(row: ITransactionRow): IMarketTransaction {
  return {
    id: row.id,
    playerId: row.player_id,
    transactionType: row.transaction_type,
    amountNexus: row.amount_nexus,
    purchasedItemId: row.purchased_item_id,
    purchasedCardIds: row.purchased_card_ids,
    createdAtIso: row.created_at,
  };
}

export class SupabaseTransactionRepository implements ITransactionRepository {
  constructor(private readonly client: SupabaseClient) {}

  async saveMarketTransaction(transaction: IMarketTransaction): Promise<void> {
    const { error } = await this.client.from("market_transactions").insert({
      id: transaction.id,
      player_id: transaction.playerId,
      transaction_type: transaction.transactionType,
      amount_nexus: transaction.amountNexus,
      purchased_item_id: transaction.purchasedItemId,
      purchased_card_ids: transaction.purchasedCardIds,
      created_at: transaction.createdAtIso,
    });
    if (error) throw new ValidationError("No se pudo registrar la transacción de mercado.");
  }

  async getMarketTransactions(playerId: string): Promise<IMarketTransaction[]> {
    const { data, error } = await this.client
      .from("market_transactions")
      .select("id,player_id,transaction_type,amount_nexus,purchased_item_id,purchased_card_ids,created_at")
      .eq("player_id", playerId)
      .order("created_at", { ascending: false });
    if (error) throw new ValidationError("No se pudo cargar el historial de transacciones.");
    return (data as ITransactionRow[]).map(toEntity);
  }
}
