// src/app/hub/training/page.tsx - Página de entrada de entrenamiento con selección entre tutorial guiado y arena progresiva.
import { HubSectionEntryBurst } from "@/components/hub/sections/HubSectionEntryBurst";
import { TrainingModeSelection } from "@/components/hub/training/TrainingModeSelection";

export default async function TrainingPage() {
  return (
    <main className="hub-control-room-bg min-h-dvh px-4 py-8 text-slate-100 sm:px-6">
      <HubSectionEntryBurst />
      <TrainingModeSelection />
    </main>
  );
}
