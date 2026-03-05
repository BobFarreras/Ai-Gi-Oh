// src/infrastructure/repositories/InMemoryTransactionRepository.ts - Repositorio mock para registrar historial de transacciones del mercado.
import { IMarketTransaction } from "@/core/entities/market/IMarketTransaction";
import { ITransactionRepository } from "@/core/repositories/ITransactionRepository";

export class InMemoryTransactionRepository implements ITransactionRepository {
  private readonly transactions: IMarketTransaction[] = [];

  async saveMarketTransaction(transaction: IMarketTransaction): Promise<void> {
    this.transactions.push({ ...transaction, purchasedCardIds: [...transaction.purchasedCardIds] });
  }

  async getMarketTransactions(playerId: string): Promise<IMarketTransaction[]> {
    return this.transactions
      .filter((transaction) => transaction.playerId === playerId)
      .map((transaction) => ({ ...transaction, purchasedCardIds: [...transaction.purchasedCardIds] }));
  }
}
