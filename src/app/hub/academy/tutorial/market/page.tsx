// src/app/hub/academy/tutorial/market/page.tsx - Página server-side del nodo Market usando motor guiado reutilizable.
import { HubSectionEntryBurst } from "@/components/hub/sections/HubSectionEntryBurst";
import { TutorialMarketClient } from "@/components/hub/academy/tutorial/nodes/market/TutorialMarketClient";

export default function TutorialMarketPage() {
  return (
    <>
      <HubSectionEntryBurst />
      <TutorialMarketClient />
    </>
  );
}
