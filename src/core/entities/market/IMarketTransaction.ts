// src/core/entities/market/IMarketTransaction.ts - Define transacciones registradas de compras y aperturas del mercado.
export type MarketTransactionType = "BUY_CARD" | "BUY_PACK";

export interface IMarketTransaction {
  id: string;
  playerId: string;
  transactionType: MarketTransactionType;
  amountNexus: number;
  purchasedItemId: string;
  purchasedCardIds: string[];
  createdAtIso: string;
}
