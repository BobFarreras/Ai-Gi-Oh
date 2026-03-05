// src/core/use-cases/market/BuyPackUseCase.test.ts - Verifica compra de sobre con entrega de 5 cartas y débito Nexus.
import { describe, expect, it } from "vitest";
import { InMemoryCardCollectionRepository } from "@/infrastructure/repositories/InMemoryCardCollectionRepository";
import { InMemoryMarketRepository } from "@/infrastructure/repositories/InMemoryMarketRepository";
import { InMemoryTransactionRepository } from "@/infrastructure/repositories/InMemoryTransactionRepository";
import { InMemoryWalletRepository } from "@/infrastructure/repositories/InMemoryWalletRepository";
import { BuyPackUseCase } from "./BuyPackUseCase";

describe("BuyPackUseCase", () => {
  it("compra sobre y entrega 5 cartas al almacén", async () => {
    const marketRepository = new InMemoryMarketRepository();
    const walletRepository = new InMemoryWalletRepository([{ playerId: "player-a", nexus: 1000 }]);
    const cardCollectionRepository = new InMemoryCardCollectionRepository("player-a");
    const transactionRepository = new InMemoryTransactionRepository();
    const useCase = new BuyPackUseCase(marketRepository, walletRepository, cardCollectionRepository, transactionRepository);
    const pack = (await marketRepository.getPackDefinitions())[0];

    const openedCardIds = await useCase.execute({ playerId: "player-a", packId: pack.id });
    const wallet = await walletRepository.getWallet("player-a");

    expect(openedCardIds).toHaveLength(5);
    expect(wallet.nexus).toBe(1000 - pack.priceNexus);
  });
});
