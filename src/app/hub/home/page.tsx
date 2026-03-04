// src/app/hub/home/page.tsx - Renderiza la pantalla base de Mi Home dentro del hub.
import { HubSectionScreen } from "@/components/hub/sections/HubSectionScreen";
import { getHubSectionViewModel } from "@/app/hub/internal/getHubSectionViewModel";

export default async function HomeModulePage() {
  const viewModel = await getHubSectionViewModel("HOME");

  return (
    <HubSectionScreen
      title={viewModel.section.title}
      description="Gestiona mazos, preferencias de cuenta y datos personales del duelista."
      isLocked={viewModel.section.isLocked}
      lockReason={viewModel.section.lockReason}
    />
  );
}
