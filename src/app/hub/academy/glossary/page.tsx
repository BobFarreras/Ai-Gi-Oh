// src/app/hub/academy/glossary/page.tsx - Códex/Glosario del juego para novatos (Fase 6).
import { AcademyGlossary } from "@/components/hub/academy/glossary/AcademyGlossary";
import { HubSectionEntryBurst } from "@/components/hub/sections/HubSectionEntryBurst";

export default function AcademyGlossaryPage() {
  return (
    <main className="hub-control-room-bg relative h-dvh overflow-hidden px-2 py-2 sm:px-3 sm:py-3 lg:px-4 lg:py-4">
      <HubSectionEntryBurst />

      <div className="pointer-events-none absolute inset-0 bg-slate-950/45" />
      <div className="pointer-events-none absolute inset-0 hub-control-ambient" />
      <div className="pointer-events-none absolute inset-0 hub-control-scan opacity-80" />

      <div className="relative z-10 mx-auto h-full w-full min-h-0 max-w-6xl">
        <AcademyGlossary />
      </div>
    </main>
  );
}
