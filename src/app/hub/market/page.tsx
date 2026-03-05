// src/app/hub/market/page.tsx - Renderiza la pantalla base del mercado dentro del hub.
import { MarketOverview } from "@/components/hub/market/MarketOverview";
import { HubSectionScreen } from "@/components/hub/sections/HubSectionScreen";
import { getHubSectionViewModel } from "@/app/hub/internal/getHubSectionViewModel";
import { GetMarketCatalogUseCase } from "@/core/use-cases/market/GetMarketCatalogUseCase";
import { InMemoryMarketRepository } from "@/infrastructure/repositories/InMemoryMarketRepository";
import { InMemoryWalletRepository } from "@/infrastructure/repositories/InMemoryWalletRepository";

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
  const getMarketCatalogUseCase = new GetMarketCatalogUseCase(
    new InMemoryMarketRepository(),
    new InMemoryWalletRepository(),
  );
  const catalog = await getMarketCatalogUseCase.execute(playerId);

  return <MarketOverview catalog={catalog} />;
}
