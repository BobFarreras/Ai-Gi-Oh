// src/app/hub/tutorial/arsenal/page.tsx - Página server-side del nodo Preparar Deck usando el motor guiado reusable.
import { HubSectionEntryBurst } from "@/components/hub/sections/HubSectionEntryBurst";
import { TutorialArsenalClient } from "@/app/hub/tutorial/arsenal/TutorialArsenalClient";

export default function TutorialArsenalPage() {
  return (
    <main className="hub-control-room-bg min-h-dvh px-4 py-8 text-slate-100 sm:px-6">
      <HubSectionEntryBurst />
      <TutorialArsenalClient />
    </main>
  );
}
