// src/core/use-cases/market/GetMarketTransactionsUseCase.ts - Obtiene historial de transacciones del mercado por jugador.
import { IMarketTransaction } from "@/core/entities/market/IMarketTransaction";
import { ITransactionRepository } from "@/core/repositories/ITransactionRepository";
import { assertValidPlayerId } from "@/core/use-cases/market/internal/assert-valid-market-input";

export class GetMarketTransactionsUseCase {
  constructor(private readonly transactionRepository: ITransactionRepository) {}

  async execute(playerId: string): Promise<IMarketTransaction[]> {
    assertValidPlayerId(playerId);
    const transactions = await this.transactionRepository.getMarketTransactions(playerId);
    return transactions.sort((transactionA, transactionB) =>
      transactionB.createdAtIso.localeCompare(transactionA.createdAtIso),
    );
  }
}
