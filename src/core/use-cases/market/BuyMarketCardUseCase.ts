// src/core/use-cases/market/BuyMarketCardUseCase.ts - Ejecuta compra de carta individual y añade la carta al almacén del jugador.
import { IMarketTransaction } from "@/core/entities/market/IMarketTransaction";
import { NotFoundError } from "@/core/errors/NotFoundError";
import { ICardCollectionRepository } from "@/core/repositories/ICardCollectionRepository";
import { IMarketRepository } from "@/core/repositories/IMarketRepository";
import { ITransactionRepository } from "@/core/repositories/ITransactionRepository";
import { IWalletRepository } from "@/core/repositories/IWalletRepository";
import { assertEnoughNexus, assertListingAvailable } from "@/core/services/market/market-economy-rules";
import { assertValidPlayerId, assertValidResourceId } from "@/core/use-cases/market/internal/assert-valid-market-input";
import { generateMarketTransactionId } from "@/core/use-cases/market/internal/generate-market-transaction-id";

interface IBuyMarketCardInput {
  playerId: string;
  listingId: string;
}

export class BuyMarketCardUseCase {
  constructor(
    private readonly marketRepository: IMarketRepository,
    private readonly walletRepository: IWalletRepository,
    private readonly cardCollectionRepository: ICardCollectionRepository,
    private readonly transactionRepository: ITransactionRepository,
  ) {}

  async execute(input: IBuyMarketCardInput): Promise<void> {
    assertValidPlayerId(input.playerId);
    assertValidResourceId(input.listingId, "listado de mercado");
    const [wallet, listings] = await Promise.all([
      this.walletRepository.getWallet(input.playerId),
      this.marketRepository.getCardListings(),
    ]);
    const listing = listings.find((currentListing) => currentListing.id === input.listingId);
    if (!listing) {
      throw new NotFoundError("No se encontró el listado de carta solicitado.");
    }

    assertListingAvailable(listing.isAvailable, listing.stock);
    assertEnoughNexus(wallet, listing.priceNexus);
    await this.walletRepository.debitNexus(input.playerId, listing.priceNexus);
    await this.cardCollectionRepository.addCards(input.playerId, [listing.card.id]);

    const transaction: IMarketTransaction = {
      id: generateMarketTransactionId(listing.id),
      playerId: input.playerId,
      transactionType: "BUY_CARD",
      amountNexus: listing.priceNexus,
      purchasedItemId: listing.id,
      purchasedCardIds: [listing.card.id],
      createdAtIso: new Date().toISOString(),
    };
    await this.transactionRepository.saveMarketTransaction(transaction);
  }
}
