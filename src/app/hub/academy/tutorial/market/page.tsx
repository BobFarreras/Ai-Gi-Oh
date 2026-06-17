// src/app/hub/academy/tutorial/market/page.tsx - Página server-side del nodo Market usando motor guiado reutilizable.
import { HubSectionEntryBurst } from "@/components/hub/sections/HubSectionEntryBurst";
import { TutorialFirstRunSoundtrackSeed } from "@/components/hub/academy/tutorial/internal/TutorialFirstRunSoundtrackSeed";
import { TutorialMarketClient } from "@/components/hub/academy/tutorial/nodes/market/TutorialMarketClient";

interface ITutorialMarketPageProps {
  searchParams?: Promise<{ returnTo?: string }>;
}

export default async function TutorialMarketPage({ searchParams }: ITutorialMarketPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const returnToHub = resolvedSearchParams?.returnTo === "hub";
  return (
    <>
      <HubSectionEntryBurst />
      <TutorialFirstRunSoundtrackSeed shouldActivate />
      <TutorialMarketClient returnToHub={returnToHub} />
    </>
  );
}
