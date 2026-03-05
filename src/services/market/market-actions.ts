// src/services/market/market-actions.ts - Acciones de mercado para UI reutilizando casos de uso y repositorios mock compartidos.
import { BuyMarketCardUseCase } from "@/core/use-cases/market/BuyMarketCardUseCase";
import { BuyPackUseCase } from "@/core/use-cases/market/BuyPackUseCase";
import { GetMarketCatalogUseCase, IMarketCatalog } from "@/core/use-cases/market/GetMarketCatalogUseCase";
import { GetMarketTransactionsUseCase } from "@/core/use-cases/market/GetMarketTransactionsUseCase";
import { IMarketTransaction } from "@/core/entities/market/IMarketTransaction";
import {
  sharedCollectionRepository,
  sharedMarketRepository,
  sharedTransactionRepository,
  sharedWalletRepository,
} from "@/infrastructure/repositories/singletons";

const getMarketCatalogUseCase = new GetMarketCatalogUseCase(sharedMarketRepository, sharedWalletRepository);
const getMarketTransactionsUseCase = new GetMarketTransactionsUseCase(sharedTransactionRepository);
const buyMarketCardUseCase = new BuyMarketCardUseCase(
  sharedMarketRepository,
  sharedWalletRepository,
  sharedCollectionRepository,
  sharedTransactionRepository,
);
const buyPackUseCase = new BuyPackUseCase(
  sharedMarketRepository,
  sharedWalletRepository,
  sharedCollectionRepository,
  sharedTransactionRepository,
);

export async function getMarketCatalogAction(playerId: string): Promise<IMarketCatalog> {
  return getMarketCatalogUseCase.execute(playerId);
}

export async function getMarketTransactionsAction(playerId: string): Promise<IMarketTransaction[]> {
  return getMarketTransactionsUseCase.execute(playerId);
}

export async function buyMarketCardAction(playerId: string, listingId: string): Promise<IMarketCatalog> {
  await buyMarketCardUseCase.execute({ playerId, listingId });
  return getMarketCatalogUseCase.execute(playerId);
}

export async function buyPackAction(playerId: string, packId: string): Promise<{ catalog: IMarketCatalog; openedCardIds: string[] }> {
  const openedCardIds = await buyPackUseCase.execute({ playerId, packId });
  const catalog = await getMarketCatalogUseCase.execute(playerId);
  return { catalog, openedCardIds };
}
