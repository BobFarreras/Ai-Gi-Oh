// src/core/use-cases/market/GetMarketCatalogUseCase.ts - Obtiene catálogo de mercado y saldo Nexus para renderizado inicial.
import { IMarketCardListing } from "@/core/entities/market/IMarketCardListing";
import { IMarketPackDefinition } from "@/core/entities/market/IMarketPackDefinition";
import { IPlayerWallet } from "@/core/entities/market/IPlayerWallet";
import { IMarketRepository } from "@/core/repositories/IMarketRepository";
import { IWalletRepository } from "@/core/repositories/IWalletRepository";
import { assertValidPlayerId } from "@/core/use-cases/market/internal/assert-valid-market-input";

export interface IMarketCatalog {
  wallet: IPlayerWallet;
  listings: IMarketCardListing[];
  packs: IMarketPackDefinition[];
}

export class GetMarketCatalogUseCase {
  constructor(
    private readonly marketRepository: IMarketRepository,
    private readonly walletRepository: IWalletRepository,
  ) {}

  async execute(playerId: string): Promise<IMarketCatalog> {
    assertValidPlayerId(playerId);
    const [wallet, listings, packs] = await Promise.all([
      this.walletRepository.getWallet(playerId),
      this.marketRepository.getCardListings(),
      this.marketRepository.getPackDefinitions(),
    ]);
    return {
      wallet,
      listings,
      packs: packs.filter((pack) => pack.isAvailable),
    };
  }
}
