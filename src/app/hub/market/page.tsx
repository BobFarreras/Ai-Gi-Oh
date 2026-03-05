// src/app/hub/market/page.tsx - Renderiza la pantalla base del mercado dentro del hub.
import { MarketScene } from "@/components/hub/market/MarketScene";
import { HubSectionScreen } from "@/components/hub/sections/HubSectionScreen";
import { getHubSectionViewModel } from "@/app/hub/internal/getHubSectionViewModel";
import { GetMarketCatalogUseCase } from "@/core/use-cases/market/GetMarketCatalogUseCase";
import { sharedMarketRepository, sharedWalletRepository } from "@/infrastructure/repositories/singletons";

export default async function MarketPage() {
  const playerId = "local-player";
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
  const getMarketCatalogUseCase = new GetMarketCatalogUseCase(sharedMarketRepository, sharedWalletRepository);
  const catalog = await getMarketCatalogUseCase.execute(playerId);

  return <MarketScene playerId={playerId} initialCatalog={catalog} />;
}
