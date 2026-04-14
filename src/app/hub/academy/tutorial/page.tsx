// src/app/hub/academy/tutorial/page.tsx - Página server-side del mapa tutorial por nodos guiados.
import { HubSectionEntryBurst } from "@/components/hub/sections/HubSectionEntryBurst";
import { TutorialMapSelection } from "@/components/hub/academy/tutorial/TutorialMapSelection";
import { TutorialMapGuideOverlay } from "@/components/hub/academy/tutorial/internal/TutorialMapGuideOverlay";
import { TutorialFirstRunSoundtrackSeed } from "@/components/hub/academy/tutorial/internal/TutorialFirstRunSoundtrackSeed";
import { resolvePrepareDeckGuideVisibility } from "@/components/hub/academy/tutorial/internal/resolve-prepare-deck-guide-visibility";
import { getTutorialMapRuntimeData } from "@/services/tutorial/get-tutorial-map-runtime-data";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function TutorialMapPage() {
  const nodes = await getTutorialMapRuntimeData();
  const shouldGuidePrepareDeck = resolvePrepareDeckGuideVisibility(nodes);
  return (
    <main className="hub-control-room-bg relative h-dvh overflow-hidden px-2 py-2 text-slate-100 sm:px-3 sm:py-3 lg:px-6 lg:py-5">
      <HubSectionEntryBurst />
      <TutorialMapGuideOverlay isVisible={shouldGuidePrepareDeck} />
      <TutorialFirstRunSoundtrackSeed shouldActivate />
      <TutorialMapSelection nodes={nodes} />
    </main>
  );
}
