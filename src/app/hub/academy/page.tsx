// src/app/hub/academy/page.tsx - Entrada server-side de Academy con selector de Tutorial/Arena.
import { HubSectionEntryBurst } from "@/components/hub/sections/HubSectionEntryBurst";
import { TrainingModeSelection } from "@/components/hub/academy/training/TrainingModeSelection";

export default async function AcademyPage() {
  return (
    <main className="hub-control-room-bg relative flex min-h-dvh flex-col items-center justify-center px-4 py-12 sm:px-6">
      <HubSectionEntryBurst />

      {/* Oscurece el fondo para priorizar el panel de selección Academy. */}
      <div className="pointer-events-none absolute inset-0 bg-slate-950/60 backdrop-blur-[2px]" />

      <div className="relative z-10 w-full max-w-5xl">
        <TrainingModeSelection />
      </div>
    </main>
  );
}
