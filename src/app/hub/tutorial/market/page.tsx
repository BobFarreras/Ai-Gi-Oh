// src/app/hub/tutorial/market/page.tsx - Página server-side del nodo Market usando motor guiado reutilizable.
import { HubSectionEntryBurst } from "@/components/hub/sections/HubSectionEntryBurst";
import { TutorialMarketClient } from "@/app/hub/tutorial/market/TutorialMarketClient";

export default function TutorialMarketPage() {
  return (
    <>
      <HubSectionEntryBurst />
      <TutorialMarketClient />
    </>
  );
}
