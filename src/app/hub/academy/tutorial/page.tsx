// src/app/hub/academy/tutorial/page.tsx - Página server-side del mapa tutorial por nodos guiados.
import { HubSectionEntryBurst } from "@/components/hub/sections/HubSectionEntryBurst";
import { TutorialMapSelection } from "@/components/hub/academy/tutorial/TutorialMapSelection";
import { getTutorialMapRuntimeData } from "@/services/tutorial/get-tutorial-map-runtime-data";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function TutorialMapPage() {
  const nodes = await getTutorialMapRuntimeData();
  return (
    <main className="hub-control-room-bg min-h-dvh px-4 py-8 text-slate-100 sm:px-6">
      <HubSectionEntryBurst />
      <TutorialMapSelection nodes={nodes} />
    </main>
  );
}
