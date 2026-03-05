// src/core/repositories/ITransactionRepository.ts - Contrato para registrar historial de compras y aperturas del mercado.
import { IMarketTransaction } from "@/core/entities/market/IMarketTransaction";

export interface ITransactionRepository {
  saveMarketTransaction(transaction: IMarketTransaction): Promise<void>;
  getMarketTransactions(playerId: string): Promise<IMarketTransaction[]>;
}
