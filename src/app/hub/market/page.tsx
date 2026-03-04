// src/app/hub/market/page.tsx - Renderiza la pantalla base del mercado dentro del hub.
import { HubSectionScreen } from "@/components/hub/sections/HubSectionScreen";
import { getHubSectionViewModel } from "@/app/hub/internal/getHubSectionViewModel";

export default async function MarketPage() {
  const viewModel = await getHubSectionViewModel("MARKET");

  return (
    <HubSectionScreen
      title={viewModel.section.title}
      description="Compra sobres, cartas individuales y recursos del juego en el mercado."
      isLocked={viewModel.section.isLocked}
      lockReason={viewModel.section.lockReason}
    />
  );
}
