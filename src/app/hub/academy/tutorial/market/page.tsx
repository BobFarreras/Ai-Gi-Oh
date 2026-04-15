// src/app/hub/academy/tutorial/market/page.tsx - Página server-side del nodo Market usando motor guiado reutilizable.
import { HubSectionEntryBurst } from "@/components/hub/sections/HubSectionEntryBurst";
import { TutorialFirstRunSoundtrackSeed } from "@/components/hub/academy/tutorial/internal/TutorialFirstRunSoundtrackSeed";
import { TutorialMarketClient } from "@/components/hub/academy/tutorial/nodes/market/TutorialMarketClient";

export default function TutorialMarketPage() {
  return (
    <>
      <HubSectionEntryBurst />
      <TutorialFirstRunSoundtrackSeed shouldActivate />
      <TutorialMarketClient />
    </>
  );
}
