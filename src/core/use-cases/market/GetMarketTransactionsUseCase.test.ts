// src/core/use-cases/market/GetMarketTransactionsUseCase.test.ts - Verifica lectura ordenada de historial de mercado.
import { describe, expect, it } from "vitest";
import { GetMarketTransactionsUseCase } from "@/core/use-cases/market/GetMarketTransactionsUseCase";
import { InMemoryTransactionRepository } from "@/infrastructure/repositories/InMemoryTransactionRepository";

describe("GetMarketTransactionsUseCase", () => {
  it("ordena de más reciente a más antigua", async () => {
    const repository = new InMemoryTransactionRepository();
    await repository.saveMarketTransaction({
      id: "tx-old",
      playerId: "player-a",
      transactionType: "BUY_CARD",
      amountNexus: 100,
      purchasedItemId: "listing-1",
      purchasedCardIds: ["entity-python"],
      createdAtIso: "2026-01-10T10:00:00.000Z",
    });
    await repository.saveMarketTransaction({
      id: "tx-new",
      playerId: "player-a",
      transactionType: "BUY_PACK",
      amountNexus: 200,
      purchasedItemId: "pack-1",
      purchasedCardIds: ["entity-vscode"],
      createdAtIso: "2026-01-10T11:00:00.000Z",
    });

    const useCase = new GetMarketTransactionsUseCase(repository);
    const transactions = await useCase.execute("player-a");

    expect(transactions.map((transaction) => transaction.id)).toEqual(["tx-new", "tx-old"]);
  });
});
