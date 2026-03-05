// src/infrastructure/repositories/InMemoryTransactionRepository.ts - Repositorio mock para registrar historial de transacciones del mercado.
import { IMarketTransaction } from "@/core/entities/market/IMarketTransaction";
import { ITransactionRepository } from "@/core/repositories/ITransactionRepository";
import { InMemoryPlayerPersistenceStore } from "@/infrastructure/repositories/state/InMemoryPlayerPersistenceStore";
import { IPlayerPersistenceStore } from "@/infrastructure/repositories/state/IPlayerPersistenceStore";

export class InMemoryTransactionRepository implements ITransactionRepository {
  constructor(private readonly store: IPlayerPersistenceStore = new InMemoryPlayerPersistenceStore()) {}

  async saveMarketTransaction(transaction: IMarketTransaction): Promise<void> {
    this.store.appendTransaction(transaction);
  }

  async getMarketTransactions(playerId: string): Promise<IMarketTransaction[]> {
    return this.store.getTransactions(playerId);
  }
}
