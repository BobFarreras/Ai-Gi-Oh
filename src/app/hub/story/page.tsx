// src/app/hub/story/page.tsx - Renderiza la pantalla base de historia dentro del hub.
import { HubSectionScreen } from "@/components/hub/sections/HubSectionScreen";
import { getHubSectionViewModel } from "@/app/hub/internal/getHubSectionViewModel";

export default async function StoryPage() {
  const viewModel = await getHubSectionViewModel("STORY");

  return (
    <HubSectionScreen
      title={viewModel.section.title}
      description="Avanza por capítulos, combate por medallas y desbloquea nuevos desafíos."
      isLocked={viewModel.section.isLocked}
      lockReason={viewModel.section.lockReason}
    />
  );
}
