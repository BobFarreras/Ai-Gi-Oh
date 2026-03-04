// src/app/hub/multiplayer/page.tsx - Renderiza la pantalla base de multijugador dentro del hub.
import { HubSectionScreen } from "@/components/hub/sections/HubSectionScreen";
import { getHubSectionViewModel } from "@/app/hub/internal/getHubSectionViewModel";

export default async function MultiplayerPage() {
  const viewModel = await getHubSectionViewModel("MULTIPLAYER");

  return (
    <HubSectionScreen
      title={viewModel.section.title}
      description="Conecta con otros duelistas y participa en duelos competitivos en línea."
      isLocked={viewModel.section.isLocked}
      lockReason={viewModel.section.lockReason}
    />
  );
}
