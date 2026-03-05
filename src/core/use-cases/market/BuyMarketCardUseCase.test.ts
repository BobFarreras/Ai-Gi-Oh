// src/core/use-cases/market/BuyMarketCardUseCase.test.ts - Verifica compra individual con débito Nexus y alta en colección.
import { describe, expect, it } from "vitest";
import { InMemoryCardCollectionRepository } from "@/infrastructure/repositories/InMemoryCardCollectionRepository";
import { InMemoryMarketRepository } from "@/infrastructure/repositories/InMemoryMarketRepository";
import { InMemoryTransactionRepository } from "@/infrastructure/repositories/InMemoryTransactionRepository";
import { InMemoryWalletRepository } from "@/infrastructure/repositories/InMemoryWalletRepository";
import { BuyMarketCardUseCase } from "./BuyMarketCardUseCase";

describe("BuyMarketCardUseCase", () => {
  it("compra carta, descuenta Nexus y registra colección", async () => {
    const marketRepository = new InMemoryMarketRepository();
    const walletRepository = new InMemoryWalletRepository([{ playerId: "player-a", nexus: 1000 }]);
    const cardCollectionRepository = new InMemoryCardCollectionRepository("player-a");
    const transactionRepository = new InMemoryTransactionRepository();
    const useCase = new BuyMarketCardUseCase(
      marketRepository,
      walletRepository,
      cardCollectionRepository,
      transactionRepository,
    );
    const listing = (await marketRepository.getCardListings())[0];

    await useCase.execute({ playerId: "player-a", listingId: listing.id });
    const wallet = await walletRepository.getWallet("player-a");
    const collection = await cardCollectionRepository.getCollection("player-a");
    const hasBoughtCard = collection.some((entry) => entry.card.id === listing.card.id && entry.ownedCopies >= 2);

    expect(wallet.nexus).toBe(1000 - listing.priceNexus);
    expect(hasBoughtCard).toBe(true);
  });
});
