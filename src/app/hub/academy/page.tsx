// src/app/hub/academy/page.tsx - Entrada server-side de Academy con escena fullscreen y layout sin márgenes en desktop.
import { Suspense } from "react";
import { AcademyScene } from "@/components/hub/academy/scene/AcademyScene";
import { HubSectionEntryBurst } from "@/components/hub/sections/HubSectionEntryBurst";
import { AcademyPostTutorialBigLogOverlay } from "@/components/hub/academy/internal/AcademyPostTutorialBigLogOverlay";

export default async function AcademyPage() {
  return (
    <main className="hub-control-room-bg relative h-dvh overflow-hidden px-2 py-2 sm:px-3 sm:py-3 lg:px-4 lg:py-4">
      <HubSectionEntryBurst />
      <Suspense fallback={null}>
        <AcademyPostTutorialBigLogOverlay />
      </Suspense>

      <div className="pointer-events-none absolute inset-0 bg-slate-950/38" />
      <div className="pointer-events-none absolute inset-0 hub-control-ambient" />
      <div className="pointer-events-none absolute inset-0 hub-control-scan opacity-85" />
      <div className="pointer-events-none absolute inset-0 hub-control-flow-lines opacity-75" />

      <div className="relative z-10 h-full w-full min-h-0">
        <AcademyScene />
      </div>
    </main>
  );
}
