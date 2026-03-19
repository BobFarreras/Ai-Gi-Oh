// src/app/hub/academy/page.tsx - Página canónica de Academia para acceder a tutorial guiado y arena de entrenamiento.
import { HubSectionEntryBurst } from "@/components/hub/sections/HubSectionEntryBurst";
import { TrainingModeSelection } from "@/components/hub/training/TrainingModeSelection";

export default async function AcademyPage() {
  return (
    <main className="hub-control-room-bg min-h-dvh px-4 py-8 text-slate-100 sm:px-6">
      <HubSectionEntryBurst />
      <TrainingModeSelection />
    </main>
  );
}
