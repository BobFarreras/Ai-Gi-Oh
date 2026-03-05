// src/core/use-cases/market/BuyPackUseCase.ts - Ejecuta compra de sobre y genera cartas mediante selección ponderada del pool.
import { NotFoundError } from "@/core/errors/NotFoundError";
import { ICardCollectionRepository } from "@/core/repositories/ICardCollectionRepository";
import { IMarketRepository } from "@/core/repositories/IMarketRepository";
import { ITransactionRepository } from "@/core/repositories/ITransactionRepository";
import { IWalletRepository } from "@/core/repositories/IWalletRepository";
import { assertEnoughNexus, assertListingAvailable } from "@/core/services/market/market-economy-rules";
import { openWeightedPack } from "@/core/services/market/pack-rng";
import { assertValidPlayerId, assertValidResourceId } from "@/core/use-cases/market/internal/assert-valid-market-input";
import { generateMarketTransactionId } from "@/core/use-cases/market/internal/generate-market-transaction-id";

interface IBuyPackInput {
  playerId: string;
  packId: string;
}

export class BuyPackUseCase {
  constructor(
    private readonly marketRepository: IMarketRepository,
    private readonly walletRepository: IWalletRepository,
    private readonly cardCollectionRepository: ICardCollectionRepository,
    private readonly transactionRepository: ITransactionRepository,
  ) {}

  async execute(input: IBuyPackInput): Promise<string[]> {
    assertValidPlayerId(input.playerId);
    assertValidResourceId(input.packId, "sobre");
    const [wallet, packs] = await Promise.all([
      this.walletRepository.getWallet(input.playerId),
      this.marketRepository.getPackDefinitions(),
    ]);
    const pack = packs.find((currentPack) => currentPack.id === input.packId);
    if (!pack) {
      throw new NotFoundError("No se encontró el sobre solicitado.");
    }

    assertListingAvailable(pack.isAvailable, null);
    assertEnoughNexus(wallet, pack.priceNexus);
    const poolEntries = await this.marketRepository.getPackPoolEntries(pack.packPoolId);
    const openedEntries = openWeightedPack(poolEntries, pack.cardsPerPack);
    const openedCardIds = openedEntries.map((entry) => entry.card.id);
    await this.walletRepository.debitNexus(input.playerId, pack.priceNexus);
    await this.cardCollectionRepository.addCards(input.playerId, openedCardIds);
    await this.transactionRepository.saveMarketTransaction({
      id: generateMarketTransactionId(pack.id),
      playerId: input.playerId,
      transactionType: "BUY_PACK",
      amountNexus: pack.priceNexus,
      purchasedItemId: pack.id,
      purchasedCardIds: openedCardIds,
      createdAtIso: new Date().toISOString(),
    });
    return openedCardIds;
  }
}
