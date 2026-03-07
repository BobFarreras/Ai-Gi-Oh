// src/app/hub/market/page.tsx - Renderiza la pantalla base del mercado dentro del hub.
import { MarketScene } from "@/components/hub/market/MarketScene";
import { HubSectionEntryBurst } from "@/components/hub/sections/HubSectionEntryBurst";
import { HubSectionScreen } from "@/components/hub/sections/HubSectionScreen";
import { getHubSectionViewModel } from "@/app/hub/internal/getHubSectionViewModel";
import { GetMarketCatalogUseCase } from "@/core/use-cases/market/GetMarketCatalogUseCase";
import { GetMarketTransactionsUseCase } from "@/core/use-cases/market/GetMarketTransactionsUseCase";
import { getCurrentUserSession } from "@/services/auth/get-current-user-session";
import { createPlayerRuntimeRepositories } from "@/services/player-persistence/create-player-runtime-repositories";
import {
  sharedCollectionRepository,
  sharedMarketRepository,
  sharedTransactionRepository,
  sharedWalletRepository,
} from "@/infrastructure/repositories/singletons";

export default async function MarketPage() {
  const session = await getCurrentUserSession();
  const playerId = session?.user.id ?? "local-player";
  const repositories = session
    ? await createPlayerRuntimeRepositories()
    : {
        marketRepository: sharedMarketRepository,
        walletRepository: sharedWalletRepository,
        collectionRepository: sharedCollectionRepository,
        transactionRepository: sharedTransactionRepository,
      };
  const viewModel = await getHubSectionViewModel("MARKET");
  if (viewModel.section.isLocked) {
    return (
      <HubSectionScreen
        title={viewModel.section.title}
        description="Compra sobres, cartas individuales y recursos del juego en el mercado."
        isLocked={viewModel.section.isLocked}
        lockReason={viewModel.section.lockReason}
      />
    );
  }
  const getMarketCatalogUseCase = new GetMarketCatalogUseCase(repositories.marketRepository, repositories.walletRepository);
  const getMarketTransactionsUseCase = new GetMarketTransactionsUseCase(repositories.transactionRepository);
  const [catalog, transactions, collection] = await Promise.all([
    getMarketCatalogUseCase.execute(playerId),
    getMarketTransactionsUseCase.execute(playerId),
    repositories.collectionRepository.getCollection(playerId),
  ]);

  return (
    <>
      <HubSectionEntryBurst />
      <MarketScene
        playerId={playerId}
        initialCatalog={catalog}
        initialTransactions={transactions}
        initialCollection={collection}
      />
    </>
  );
}
